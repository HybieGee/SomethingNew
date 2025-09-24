import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { CompleteQuestSchema, GAME_CONFIG, generateId } from '../shared/index';
import { getSolanaPrice, storePricePrediction, checkPredictionResult } from '../services/solana-price';
import { getRandomQuestions, calculateTriviaReward } from '../services/trivia';
import type { Env } from '../types';

export const questRouter = new Hono<{ Bindings: Env }>();

questRouter.get('/', authMiddleware, async (c) => {
  const user = c.get('user');

  const quests = await c.env.DB.prepare(`
    SELECT * FROM quests WHERE active = true
  `).all();

  const completions = await c.env.DB.prepare(`
    SELECT quest_id, MAX(completed_at) as last_completed
    FROM quest_completions
    WHERE user_id = ?
    GROUP BY quest_id
  `).bind(user.id).all();

  const completionMap = new Map();
  completions.results.forEach((comp: any) => {
    completionMap.set(comp.quest_id, new Date(comp.last_completed));
  });

  const questsWithCooldown = await Promise.all(quests.results.map(async (quest: any) => {
    const lastCompleted = completionMap.get(quest.id);
    let cooldownRemaining = 0;

    if (lastCompleted) {
      const cooldownMs = quest.cooldown_minutes * 60 * 1000;
      const timeSince = Date.now() - lastCompleted.getTime();
      cooldownRemaining = Math.max(0, cooldownMs - timeSince);
    }

    // Check for active predictions
    let activePrediction = null;
    if (quest.slug === 'solana_prediction') {
      const predictionData = await c.env.CACHE.get(`prediction:${user.id}:${quest.id}`, 'json');
      if (predictionData) {
        activePrediction = predictionData;
      }
    }

    return {
      ...quest,
      cooldownRemaining,
      available: cooldownRemaining === 0,
      activePrediction
    };
  }));

  return c.json({ quests: questsWithCooldown });
});

// Get trivia questions
questRouter.get('/trivia', authMiddleware, async (c) => {
  const questions = getRandomQuestions(5);

  // Store questions in cache for validation
  const sessionId = generateId();
  await c.env.CACHE.put(
    `trivia:${c.get('user').id}:${sessionId}`,
    JSON.stringify(questions),
    { expirationTtl: 600 } // 10 minutes to complete
  );

  // Return questions without answers
  const sanitizedQuestions = questions.map(q => ({
    id: q.id,
    question: q.question,
    options: q.options
  }));

  return c.json({
    sessionId,
    questions: sanitizedQuestions
  });
});

// Submit trivia answers
questRouter.post('/trivia/submit', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { sessionId, answers, questSlug } = body;

    // Get the original questions from cache
    const questionsJson = await c.env.CACHE.get(`trivia:${user.id}:${sessionId}`, 'text');
    if (!questionsJson) {
      return c.json({ error: 'Trivia session expired or not found' }, 404);
    }

    const questions = JSON.parse(questionsJson);
    let correctCount = 0;

    // Check answers
    questions.forEach((q: any, index: number) => {
      if (answers[index] === q.correctAnswer) {
        correctCount++;
      }
    });

    // Calculate reward
    const reward = calculateTriviaReward(correctCount, questions.length);

    // Update user tickets
    const userInfo = await c.env.DB.prepare(`
      SELECT tickets FROM users WHERE id = ?
    `).bind(user.id).first<any>();

    const newTickets = (userInfo?.tickets || 0) + reward;

    await c.env.DB.prepare(`
      UPDATE users SET tickets = ? WHERE id = ?
    `).bind(newTickets, user.id).run();

    // Record quest completion
    const quest = await c.env.DB.prepare(`
      SELECT id FROM quests WHERE slug = ?
    `).bind(questSlug).first<any>();

    if (quest) {
      await c.env.DB.prepare(`
        INSERT INTO quest_completions (id, user_id, quest_id, tickets_earned, result)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        generateId(),
        user.id,
        quest.id,
        reward,
        JSON.stringify({ correct: correctCount, total: questions.length })
      ).run();
    }

    // Clear the session
    await c.env.CACHE.delete(`trivia:${user.id}:${sessionId}`);

    return c.json({
      success: true,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      reward,
      newTickets,
      results: questions.map((q: any, i: number) => ({
        correct: answers[i] === q.correctAnswer,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      }))
    });
  } catch (error: any) {
    console.error('Trivia submission error:', error);
    return c.json({ error: 'Failed to submit trivia', details: error.message }, 500);
  }
});

// Check Solana prediction result
questRouter.get('/prediction/check', authMiddleware, async (c) => {
  const user = c.get('user');
  const questSlug = c.req.query('quest');

  const quest = await c.env.DB.prepare(`
    SELECT id FROM quests WHERE slug = ?
  `).bind(questSlug).first<any>();

  if (!quest) {
    return c.json({ error: 'Quest not found' }, 404);
  }

  const result = await checkPredictionResult(c.env, user.id, quest.id);

  if (result.success && result.reward) {
    // Update user tickets
    const userInfo = await c.env.DB.prepare(`
      SELECT tickets FROM users WHERE id = ?
    `).bind(user.id).first<any>();

    const newTickets = (userInfo?.tickets || 0) + result.reward;

    await c.env.DB.prepare(`
      UPDATE users SET tickets = ? WHERE id = ?
    `).bind(newTickets, user.id).run();

    // Record completion
    await c.env.DB.prepare(`
      INSERT INTO quest_completions (id, user_id, quest_id, tickets_earned, result)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      generateId(),
      user.id,
      quest.id,
      result.reward,
      result.message
    ).run();

    return c.json({
      success: true,
      reward: result.reward,
      newTickets,
      message: result.message
    });
  }

  return c.json({
    success: false,
    message: result.message
  });
});

questRouter.post('/complete', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const data = CompleteQuestSchema.parse(body);

    const quest = await c.env.DB.prepare(`
      SELECT * FROM quests WHERE slug = ? AND active = true
    `).bind(data.questSlug).first<any>();

    if (!quest) {
      return c.json({ error: 'Quest not found' }, 404);
    }

    // Check cooldown
    const lastCompletion = await c.env.DB.prepare(`
      SELECT completed_at FROM quest_completions
      WHERE user_id = ? AND quest_id = ?
      ORDER BY completed_at DESC
      LIMIT 1
    `).bind(user.id, quest.id).first<any>();

    if (lastCompletion) {
      const cooldownMs = quest.cooldown_minutes * 60 * 1000;
      const timeSince = Date.now() - new Date(lastCompletion.completed_at).getTime();

      if (timeSince < cooldownMs) {
        return c.json({
          error: 'Quest on cooldown',
          cooldownRemaining: cooldownMs - timeSince
        }, 429);
      }
    }

    let reward = quest.min_reward;
    let result: any = {};

    switch (quest.type) {
      case 'up_down_call':
        // Handle Solana prediction
        if (quest.slug === 'solana_prediction' && data.choice) {
          const currentPrice = await getSolanaPrice();
          await storePricePrediction(
            c.env,
            user.id,
            quest.id,
            data.choice as 'up' | 'down',
            currentPrice
          );

          return c.json({
            success: true,
            message: `Prediction recorded! SOL is currently at $${currentPrice.toFixed(2)}. Check back in 1 hour for results.`,
            currentPrice
          });
        }
        break;

      case 'tap_challenge':
        // Handle tap challenge
        if (data.score) {
          // Calculate reward based on score
          const maxScore = 100;
          const percentage = Math.min(data.score / maxScore, 1);
          reward = Math.floor(quest.min_reward + (quest.max_reward - quest.min_reward) * percentage);
          result = { score: data.score };
        }
        break;

      case 'trivia':
        // Trivia is handled by separate endpoints
        return c.json({
          error: 'Use /quests/trivia endpoint for trivia quests'
        }, 400);

      default:
        return c.json({ error: 'Unknown quest type' }, 400);
    }

    // Update user tickets
    const userInfo = await c.env.DB.prepare(`
      SELECT tickets FROM users WHERE id = ?
    `).bind(user.id).first<any>();

    const newTickets = (userInfo?.tickets || 0) + reward;

    await c.env.DB.prepare(`
      UPDATE users SET tickets = ? WHERE id = ?
    `).bind(newTickets, user.id).run();

    // Record completion
    await c.env.DB.prepare(`
      INSERT INTO quest_completions (id, user_id, quest_id, tickets_earned, result)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      generateId(),
      user.id,
      quest.id,
      reward,
      JSON.stringify(result)
    ).run();

    return c.json({
      success: true,
      reward,
      newTickets,
      result
    });
  } catch (error: any) {
    console.error('Quest completion error:', error);
    return c.json({ error: 'Failed to complete quest', details: error.message }, 500);
  }
});

// Utility function (remove from here if exists elsewhere)
async function fetchCoinPrice(): Promise<number> {
  return Math.random() * 100 + 50;
}