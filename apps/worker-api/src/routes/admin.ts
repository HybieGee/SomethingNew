import { Hono } from 'hono';
import { adminMiddleware } from '../middleware/auth';
import { AdminClaimSchema, AdminBoostSchema, AdminDrawSchema } from '@raffle-arcade/shared';
import type { Env } from '../types';

export const adminRouter = new Hono<{ Bindings: Env }>();

adminRouter.use('*', adminMiddleware);

adminRouter.post('/claim', async (c) => {
  try {
    const body = await c.req.json();
    const data = AdminClaimSchema.parse(body);

    const currentSeason = await c.env.DB.prepare(`
      SELECT id, prize_pool FROM seasons
      WHERE active = true
      LIMIT 1
    `).first<any>();

    if (!currentSeason) {
      return c.json({ error: 'No active season' }, 400);
    }

    const seasonAmount = Math.floor(data.amount * data.split.seasonPool);
    const raffleAmount = Math.floor(data.amount * data.split.raffles);
    const boostAmount = Math.floor(data.amount * data.split.boost);

    await c.env.DB.prepare(`
      UPDATE seasons
      SET prize_pool = prize_pool + ?
      WHERE id = ?
    `).bind(seasonAmount, currentSeason.id).run();

    const upcomingRaffles = await c.env.DB.prepare(`
      SELECT id, prize_pool FROM raffles
      WHERE status = 'upcoming'
      ORDER BY start_time ASC
      LIMIT 3
    `).all();

    const raffleBonus = Math.floor(raffleAmount / upcomingRaffles.results.length);

    for (const raffle of upcomingRaffles.results) {
      await c.env.DB.prepare(`
        UPDATE raffles
        SET prize_pool = prize_pool + ?
        WHERE id = ?
      `).bind(raffleBonus, raffle.id).run();
    }

    if (boostAmount > 0) {
      const boostEnd = new Date();
      boostEnd.setHours(boostEnd.getHours() + 4);

      await c.env.DB.prepare(`
        INSERT INTO boosts (id, type, multiplier, start_time, end_time, source, active)
        VALUES (?, 'global', 1.25, datetime('now'), ?, 'creator_claim', true)
      `).bind(crypto.randomUUID(), boostEnd.toISOString()).run();

      await c.env.CACHE.put(
        'global_boost',
        JSON.stringify({
          multiplier: 1.25,
          endTime: boostEnd.toISOString(),
          source: 'creator_claim'
        }),
        { expirationTtl: 4 * 60 * 60 }
      );
    }

    await c.env.DB.prepare(`
      INSERT INTO admin_claims (id, tx, amount, token, season_pool, raffle_pool, boost_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      data.tx,
      data.amount,
      data.token,
      seasonAmount,
      raffleAmount,
      boostAmount
    ).run();

    return c.json({
      success: true,
      seasonPool: currentSeason.prize_pool + seasonAmount,
      rafflesUpdated: upcomingRaffles.results.length,
      boostActive: boostAmount > 0
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

adminRouter.post('/boost', async (c) => {
  try {
    const body = await c.req.json();
    const data = AdminBoostSchema.parse(body);

    const boostId = crypto.randomUUID();
    const startTime = new Date(data.startMs);
    const endTime = new Date(data.endMs);

    await c.env.DB.prepare(`
      INSERT INTO boosts (id, type, multiplier, start_time, end_time, source, active)
      VALUES (?, 'global', ?, ?, ?, 'admin', true)
    `).bind(boostId, data.multiplier, startTime.toISOString(), endTime.toISOString()).run();

    await c.env.CACHE.put(
      'global_boost',
      JSON.stringify({
        id: boostId,
        multiplier: data.multiplier,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        source: 'admin'
      }),
      { expirationTtl: Math.floor((endTime.getTime() - Date.now()) / 1000) }
    );

    return c.json({
      success: true,
      boostId,
      duration: endTime.getTime() - startTime.getTime()
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

adminRouter.post('/draw', async (c) => {
  try {
    const body = await c.req.json();
    const data = AdminDrawSchema.parse(body);

    const raffle = await c.env.DB.prepare(`
      SELECT * FROM raffles
      WHERE id = ? AND status IN ('active', 'drawing')
    `).bind(data.raffleId).first<any>();

    if (!raffle) {
      return c.json({ error: 'Raffle not found or already completed' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE raffles SET status = 'drawing' WHERE id = ?
    `).bind(data.raffleId).run();

    const doId = c.env.RAFFLE_DO.idFromName(data.raffleId);
    const doStub = c.env.RAFFLE_DO.get(doId);

    const response = await doStub.fetch(new Request('http://do/draw', {
      method: 'POST',
      body: JSON.stringify({ winnerCount: raffle.winner_count })
    }));

    const result = await response.json();

    return c.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

adminRouter.get('/stats', async (c) => {
  const stats = await c.env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM users) as totalUsers,
      (SELECT SUM(tickets) FROM users) as totalTickets,
      (SELECT COUNT(*) FROM raffles WHERE status = 'completed') as completedRaffles,
      (SELECT SUM(prize_pool) FROM seasons WHERE active = true) as currentPrizePool,
      (SELECT COUNT(*) FROM quest_completions WHERE date(completed_at) = date('now')) as questsToday
  `).first();

  return c.json({ stats });
});