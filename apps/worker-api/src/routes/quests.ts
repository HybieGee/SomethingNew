import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { CompleteQuestSchema, GAME_CONFIG } from '@raffle-arcade/shared';
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

  const questsWithCooldown = quests.results.map((quest: any) => {
    const lastCompleted = completionMap.get(quest.id);
    let cooldownRemaining = 0;

    if (lastCompleted) {
      const cooldownMs = quest.cooldown_minutes * 60 * 1000;
      const timeSince = Date.now() - lastCompleted.getTime();
      cooldownRemaining = Math.max(0, cooldownMs - timeSince);
    }

    return {
      ...quest,
      cooldownRemaining,
      available: cooldownRemaining === 0
    };
  });

  return c.json({ quests: questsWithCooldown });
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
        const coinPrice = await fetchCoinPrice();
        await c.env.CACHE.put(
          `price_check:${user.id}:${quest.id}`,
          JSON.stringify({ price: coinPrice, choice: data.choice, timestamp: Date.now() }),
          { expirationTtl: 120 }
        );

        setTimeout(async () => {
          const newPrice = await fetchCoinPrice();
          const correct = (data.choice === 'up' && newPrice > coinPrice) ||
                         (data.choice === 'down' && newPrice < coinPrice);

          if (correct) {
            reward = quest.max_reward;
          }

          await completeQuestTransaction(
            c.env.DB,
            user.id,
            quest.id,
            reward,
            { choice: data.choice, correct, oldPrice: coinPrice, newPrice }
          );
        }, 60000);

        return c.json({
          success: true,
          message: 'Prediction recorded, check back in 60 seconds',
          questId: quest.id
        });

      case 'tap_challenge':
        const score = data.score || 0;
        reward = Math.min(quest.max_reward, quest.min_reward + Math.floor(score / 10));
        result = { score };
        break;

      case 'trivia':
        const correctAnswers = validateTriviaAnswers(data.answers || []);
        const percentage = (correctAnswers / 5) * 100;
        reward = quest.min_reward + Math.floor((quest.max_reward - quest.min_reward) * (percentage / 100));
        result = { correctAnswers, percentage };
        break;
    }

    await completeQuestTransaction(c.env.DB, user.id, quest.id, reward, result);

    return c.json({
      success: true,
      reward,
      result
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

async function completeQuestTransaction(
  db: D1Database,
  userId: string,
  questId: string,
  reward: number,
  result: any
) {
  const userInfo = await db.prepare(
    'SELECT tickets FROM users WHERE id = ?'
  ).bind(userId).first<any>();

  const newTickets = userInfo.tickets + reward;

  await db.batch([
    db.prepare(`
      UPDATE users SET tickets = ? WHERE id = ?
    `).bind(newTickets, userId),

    db.prepare(`
      INSERT INTO quest_completions (id, user_id, quest_id, tickets_earned, result)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      userId,
      questId,
      reward,
      JSON.stringify(result)
    ),

    db.prepare(`
      INSERT INTO earn_log (id, user_id, amount, source, metadata)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      userId,
      reward,
      'quest_completion',
      JSON.stringify({ questId, result })
    )
  ]);
}

async function fetchCoinPrice(): Promise<number> {
  return 0.00001234 + (Math.random() * 0.000001);
}

function validateTriviaAnswers(answers: string[]): number {
  const correctAnswers = ['a', 'b', 'c', 'a', 'b'];
  let correct = 0;

  answers.forEach((answer, index) => {
    if (answer === correctAnswers[index]) correct++;
  });

  return correct;
}