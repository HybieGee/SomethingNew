import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { CompleteQuestSchema, GAME_CONFIG, generateId } from '../shared/index';
import { getSolanaPrice, storePricePrediction, checkPredictionResult } from '../services/solana-price';
import { getRandomQuestions, calculateTriviaReward } from '../services/trivia';
import { questRateLimit } from '../middleware/rateLimit';
import { questsCache } from '../middleware/cache';
import type { Env } from '../types';

export const questRouter = new Hono<{ Bindings: Env }>();

questRouter.get('/', authMiddleware, questsCache, async (c) => {
  try {
    console.log('🔍 Quest endpoint hit - user authenticated:', !!c.get('user'));
    const user = c.get('user');
    console.log('🔍 User ID:', user?.id);

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
      // First check cache
      let predictionData = await c.env.CACHE.get(`prediction:${user.id}:${quest.id}`, 'json');

      // If not in cache, check database for unresolved predictions that are still active
      if (!predictionData) {
        const dbPrediction = await c.env.DB.prepare(`
          SELECT * FROM price_predictions
          WHERE user_id = ? AND quest_id = ? AND resolved = FALSE AND expires_at > datetime('now')
          ORDER BY created_at DESC LIMIT 1
        `).bind(user.id, quest.id).first();

        if (dbPrediction) {
          predictionData = {
            predictionId: dbPrediction.id,
            prediction: dbPrediction.prediction,
            initialPrice: dbPrediction.initial_price,
            expiresAt: dbPrediction.expires_at
          };
        }
      }

      if (predictionData) {
        activePrediction = predictionData;
      }
    } else if (quest.slug === 'whale_hunt') {
      // Check for volume predictions
      const volumePrediction = await c.env.CACHE.get(`volume_prediction:${user.id}:${quest.id}`, 'json');
      if (volumePrediction) {
        activePrediction = volumePrediction;
      }
    }

    // Check for faction loyalty tracking
    let factionLoyaltyProgress = null;
    if (quest.slug === 'faction_loyalty') {
      const activeTracking = await c.env.DB.prepare(`
        SELECT * FROM faction_loyalty_tracking
        WHERE user_id = ? AND quest_id = ? AND completed = FALSE
      `).bind(user.id, quest.id).first<any>();

      if (activeTracking) {
        const startTime = new Date(activeTracking.started_at);
        const now = new Date();
        const hoursElapsed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        const hoursRemaining = Math.ceil(24 - hoursElapsed);

        factionLoyaltyProgress = {
          inProgress: true,
          hoursRemaining: Math.max(0, hoursRemaining),
          canClaim: hoursElapsed >= 24
        };
      }
    }

    return {
      ...quest,
      cooldownRemaining,
      available: cooldownRemaining === 0,
      activePrediction,
      factionLoyaltyProgress
    };
  }));

  console.log('🔍 Returning quests count:', questsWithCooldown.length);
  return c.json({ quests: questsWithCooldown });
  } catch (error) {
    console.error('❌ Quest endpoint error:', error);
    return c.json({ error: 'Failed to load quests', details: error.message }, 500);
  }
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
    const baseReward = calculateTriviaReward(correctCount, questions.length);

    // Apply faction multiplier to reward
    let finalReward = baseReward;
    const userFaction = await c.env.DB.prepare(`
      SELECT f.bonus_multiplier
      FROM user_factions uf
      JOIN factions f ON uf.faction_id = f.id
      WHERE uf.user_id = ?
    `).bind(user.id).first<any>();

    if (userFaction && userFaction.bonus_multiplier) {
      finalReward = Math.floor(baseReward * userFaction.bonus_multiplier);
    }

    // Update user tickets
    const userInfo = await c.env.DB.prepare(`
      SELECT tickets FROM users WHERE id = ?
    `).bind(user.id).first<any>();

    const newTickets = (userInfo?.tickets || 0) + finalReward;

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
        finalReward,
        JSON.stringify({ correct: correctCount, total: questions.length })
      ).run();
    }

    // Clear the session
    await c.env.CACHE.delete(`trivia:${user.id}:${sessionId}`);

    return c.json({
      success: true,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      reward: finalReward,
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
    // Apply faction multiplier to reward
    let finalReward = result.reward;
    const userFaction = await c.env.DB.prepare(`
      SELECT f.bonus_multiplier
      FROM user_factions uf
      JOIN factions f ON uf.faction_id = f.id
      WHERE uf.user_id = ?
    `).bind(user.id).first<any>();

    if (userFaction && userFaction.bonus_multiplier) {
      finalReward = Math.floor(result.reward * userFaction.bonus_multiplier);
    }

    // Update user tickets
    const userInfo = await c.env.DB.prepare(`
      SELECT tickets FROM users WHERE id = ?
    `).bind(user.id).first<any>();

    const newTickets = (userInfo?.tickets || 0) + finalReward;

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
      finalReward,
      result.message
    ).run();

    return c.json({
      success: true,
      reward: finalReward,
      newTickets,
      message: result.message
    });
  }

  return c.json({
    success: false,
    message: result.message
  });
});

questRouter.post('/complete', authMiddleware, questRateLimit, async (c) => {
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
          const currentPrice = await getSolanaPrice(c.env.CACHE);
          await storePricePrediction(
            c.env,
            user.id,
            quest.id,
            data.choice as 'up' | 'down',
            currentPrice
          );

          return c.json({
            success: true,
            message: `Prediction recorded! SOL is currently at $${currentPrice.toFixed(2)}. Check back in 30 minutes for results.`,
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

      case 'loyalty_streak':
        // Handle faction loyalty
        if (quest.slug === 'faction_loyalty') {
          const userFaction = await c.env.DB.prepare(`
            SELECT faction_id, joined_at FROM user_factions WHERE user_id = ?
          `).bind(user.id).first<any>();

          if (!userFaction) {
            return c.json({ error: 'You must join a faction first' }, 400);
          }

          // Check if user has an active loyalty tracking session
          const activeTracking = await c.env.DB.prepare(`
            SELECT * FROM faction_loyalty_tracking
            WHERE user_id = ? AND quest_id = ? AND completed = FALSE
          `).bind(user.id, quest.id).first<any>();

          if (activeTracking) {
            // Check if 24 hours have passed
            const startTime = new Date(activeTracking.started_at);
            const now = new Date();
            const hoursElapsed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);

            if (hoursElapsed >= 24) {
              // Complete the loyalty bonus
              await c.env.DB.prepare(`
                UPDATE faction_loyalty_tracking
                SET completed = TRUE
                WHERE id = ?
              `).bind(activeTracking.id).run();

              reward = Math.floor(quest.min_reward + Math.random() * (quest.max_reward - quest.min_reward));
              result = { hoursLoyalToFaction: 24 };
            } else {
              return c.json({
                error: 'Faction loyalty in progress',
                message: `${Math.ceil(24 - hoursElapsed)} hours remaining for loyalty bonus`,
                hoursRemaining: Math.ceil(24 - hoursElapsed)
              }, 429);
            }
          } else {
            // Start faction loyalty tracking
            const trackingId = generateId();
            await c.env.DB.prepare(`
              INSERT INTO faction_loyalty_tracking (id, user_id, quest_id, faction_id)
              VALUES (?, ?, ?, ?)
            `).bind(trackingId, user.id, quest.id, userFaction.faction_id).run();

            return c.json({
              success: true,
              message: 'Faction loyalty tracking started! Stay in your faction for 24 hours',
              trackingStarted: true
            });
          }
        }
        break;

      case 'trivia':
        // Regular trivia is handled by separate endpoints
        return c.json({
          error: 'Use /quests/trivia endpoint for trivia quests'
        }, 400);

      case 'volume_prediction':
        // Handle volume prediction for whale hunting
        if (quest.slug === 'whale_hunt' && data.choice) {
          // Store the prediction (similar to Solana prediction but for launchpad volume)
          const predictionId = generateId();
          await c.env.CACHE.put(
            `volume_prediction:${user.id}:${quest.id}`,
            JSON.stringify({
              predictionId,
              choice: data.choice,
              timestamp: new Date().toISOString()
            }),
            { expirationTtl: 7200 } // 2 hours
          );

          return c.json({
            success: true,
            message: `Prediction recorded! You chose ${(data.choice as string).toUpperCase()}. Check back in 2 hours for results.`
          });
        }
        break;

      default:
        return c.json({ error: `Unknown quest type: ${quest.type}` }, 400);
    }

    // Apply faction multiplier to reward
    let finalReward = reward;
    const userFaction = await c.env.DB.prepare(`
      SELECT f.bonus_multiplier
      FROM user_factions uf
      JOIN factions f ON uf.faction_id = f.id
      WHERE uf.user_id = ?
    `).bind(user.id).first<any>();

    if (userFaction && userFaction.bonus_multiplier) {
      finalReward = Math.floor(reward * userFaction.bonus_multiplier);
    }

    // Update user tickets
    const userInfo = await c.env.DB.prepare(`
      SELECT tickets FROM users WHERE id = ?
    `).bind(user.id).first<any>();

    const newTickets = (userInfo?.tickets || 0) + finalReward;

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
      finalReward,
      JSON.stringify(result)
    ).run();

    return c.json({
      success: true,
      reward: finalReward,
      newTickets,
      result
    });
  } catch (error: any) {
    console.error('Quest completion error:', error);
    return c.json({ error: 'Failed to complete quest', details: error.message }, 500);
  }
});

// Utility endpoint to clear stuck predictions (temporary fix)
questRouter.post('/prediction/clear', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { questSlug } = body;

    const quest = await c.env.DB.prepare(`
      SELECT id FROM quests WHERE slug = ?
    `).bind(questSlug).first<any>();

    if (!quest) {
      return c.json({ error: 'Quest not found' }, 404);
    }

    // Clear any unresolved predictions for this user/quest
    await c.env.DB.prepare(`
      UPDATE price_predictions
      SET resolved = TRUE
      WHERE user_id = ? AND quest_id = ? AND resolved = FALSE
    `).bind(user.id, quest.id).run();

    // Clear cache
    await c.env.CACHE.delete(`prediction:${user.id}:${quest.id}`);

    return c.json({
      success: true,
      message: 'Cleared stuck prediction'
    });
  } catch (error: any) {
    console.error('Clear prediction error:', error);
    return c.json({ error: 'Failed to clear prediction' }, 500);
  }
});

// Utility function (remove from here if exists elsewhere)
async function fetchCoinPrice(): Promise<number> {
  return Math.random() * 100 + 50;
}