import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { UpdateAddressSchema } from '../shared/index';
import { calculateDailyReward, GAME_CONFIG, generateId } from '../shared/index';
import type { Env } from '../types';

export const profileRouter = new Hono<{ Bindings: Env }>();

profileRouter.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');

  const profile = await c.env.DB.prepare(`
    SELECT u.id, u.username, u.tickets, u.streak_days, u.solana_address, u.created_at, u.last_login_at,
      (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id) as badge_count,
      (SELECT COUNT(*) FROM quest_completions WHERE user_id = u.id AND date(completed_at) = date('now')) as quests_today
    FROM users u
    WHERE u.id = ?
  `).bind(user.id).first();

  const badges = await c.env.DB.prepare(`
    SELECT b.* FROM badges b
    JOIN user_badges ub ON b.id = ub.badge_id
    WHERE ub.user_id = ?
    ORDER BY ub.earned_at DESC
  `).bind(user.id).all();

  const activeBoost = await c.env.DB.prepare(`
    SELECT * FROM boosts
    WHERE type = 'global' AND active = true
      AND datetime('now') BETWEEN start_time AND end_time
    ORDER BY multiplier DESC
    LIMIT 1
  `).first();

  return c.json({
    profile: {
      ...profile,
      badges: badges.results
    },
    activeBoost
  });
});

profileRouter.post('/me/daily', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    const userInfo = await c.env.DB.prepare(`
      SELECT streak_days, last_daily_claim_at, tickets
      FROM users WHERE id = ?
    `).bind(user.id).first<any>();

    if (!userInfo) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check if already claimed today (24 hour cooldown)
    if (userInfo.last_daily_claim_at) {
      const lastClaim = new Date(userInfo.last_daily_claim_at);
      const now = new Date();
      const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastClaim < 24) {
        return c.json({
          error: `Already claimed today. Next claim in ${Math.ceil(24 - hoursSinceLastClaim)} hours`,
          nextClaimIn: Math.ceil(24 - hoursSinceLastClaim)
        }, 429);
      }
    }

    const streakDays = (userInfo.streak_days || 0) + 1;
    const reward = calculateDailyReward(GAME_CONFIG.DAILY_REWARD_BASE, streakDays);
    const newTickets = (userInfo.tickets || 0) + reward;

    // Update user
    await c.env.DB.prepare(`
      UPDATE users
      SET tickets = ?, streak_days = ?, last_daily_claim_at = datetime('now')
      WHERE id = ?
    `).bind(newTickets, streakDays, user.id).run();

    // Log the reward
    try {
      await c.env.DB.prepare(`
        INSERT INTO earn_log (id, user_id, amount, source, metadata)
        VALUES (?, ?, ?, 'daily_reward', ?)
      `).bind(
        generateId(),
        user.id,
        reward,
        JSON.stringify({ streakDays })
      ).run();
    } catch (logError) {
      console.error('Failed to log reward:', logError);
      // Continue even if logging fails
    }

    return c.json({
      success: true,
      reward,
      newTickets,
      streakDays
    });
  } catch (error: any) {
    console.error('Daily reward error:', error);
    return c.json({ error: 'Failed to claim daily reward', details: error.message }, 500);
  }
});

profileRouter.post('/me/address', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const data = UpdateAddressSchema.parse(body);

    await c.env.DB.prepare(
      'UPDATE users SET solana_address = ? WHERE id = ?'
    ).bind(data.solanaAddress, user.id).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

profileRouter.get('/leaderboard', async (c) => {
  const season = c.req.query('season') || 'current';

  const leaderboard = await c.env.DB.prepare(`
    SELECT
      u.id as userId,
      u.username,
      u.tickets,
      u.streak_days as streakDays,
      COUNT(DISTINCT ub.badge_id) as badges,
      ROW_NUMBER() OVER (ORDER BY u.tickets DESC) as rank
    FROM users u
    LEFT JOIN user_badges ub ON u.id = ub.user_id
    GROUP BY u.id
    ORDER BY u.tickets DESC
    LIMIT 100
  `).all();

  return c.json({
    season,
    leaderboard: leaderboard.results
  });
});