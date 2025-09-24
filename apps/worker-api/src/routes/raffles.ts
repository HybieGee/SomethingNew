import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { EnterRaffleSchema, generateId } from '../shared/index';
import type { Env } from '../types';

export const raffleRouter = new Hono<{ Bindings: Env }>();

raffleRouter.get('/next', async (c) => {
  // First, handle expired raffles
  await handleExpiredRaffles(c.env);

  // Ensure we have active raffles
  await ensureActiveRaffles(c.env);

  const raffles = await c.env.DB.prepare(`
    SELECT * FROM raffles
    WHERE status IN ('upcoming', 'active')
    ORDER BY start_time ASC
    LIMIT 10
  `).all();

  const rafflesWithEntries = await Promise.all(
    raffles.results.map(async (raffle: any) => {
      const entries = await c.env.DB.prepare(`
        SELECT COUNT(*) as entry_count, SUM(ticket_count) as total_tickets
        FROM raffle_entries
        WHERE raffle_id = ?
      `).bind(raffle.id).first();

      const timeRemaining = new Date(raffle.end_time).getTime() - Date.now();

      return {
        ...raffle,
        entryCount: entries?.entry_count || 0,
        totalTickets: entries?.total_tickets || 0,
        timeRemaining: Math.max(0, timeRemaining)
      };
    })
  );

  return c.json({ raffles: rafflesWithEntries });
});

raffleRouter.post('/enter', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const data = EnterRaffleSchema.parse(body);

    const raffle = await c.env.DB.prepare(`
      SELECT * FROM raffles
      WHERE id = ? AND status = 'active'
    `).bind(data.raffleId).first<any>();

    if (!raffle) {
      return c.json({ error: 'Raffle not found or not active' }, 404);
    }

    const userInfo = await c.env.DB.prepare(
      'SELECT tickets FROM users WHERE id = ?'
    ).bind(user.id).first<any>();

    const totalCost = raffle.ticket_cost * data.tickets;

    if (userInfo.tickets < totalCost) {
      return c.json({ error: 'Insufficient tickets' }, 400);
    }

    const existingEntry = await c.env.DB.prepare(`
      SELECT ticket_count FROM raffle_entries
      WHERE raffle_id = ? AND user_id = ?
    `).bind(data.raffleId, user.id).first<any>();

    const currentTickets = existingEntry?.ticket_count || 0;

    if (currentTickets + data.tickets > raffle.max_entries_per_user) {
      return c.json({
        error: 'Exceeds max entries per user',
        maxEntries: raffle.max_entries_per_user,
        currentEntries: currentTickets
      }, 400);
    }

    await c.env.DB.batch([
      c.env.DB.prepare(`
        UPDATE users SET tickets = tickets - ? WHERE id = ?
      `).bind(totalCost, user.id),

      existingEntry
        ? c.env.DB.prepare(`
            UPDATE raffle_entries
            SET ticket_count = ticket_count + ?
            WHERE raffle_id = ? AND user_id = ?
          `).bind(data.tickets, data.raffleId, user.id)
        : c.env.DB.prepare(`
            INSERT INTO raffle_entries (id, raffle_id, user_id, ticket_count)
            VALUES (?, ?, ?, ?)
          `).bind(crypto.randomUUID(), data.raffleId, user.id, data.tickets),

      c.env.DB.prepare(`
        INSERT INTO earn_log (id, user_id, amount, source, metadata)
        VALUES (?, ?, ?, 'raffle_entry', ?)
      `).bind(
        crypto.randomUUID(),
        user.id,
        -totalCost,
        JSON.stringify({ raffleId: data.raffleId, tickets: data.tickets })
      )
    ]);

    const doId = c.env.RAFFLE_DO.idFromName(data.raffleId);
    const doStub = c.env.RAFFLE_DO.get(doId);

    await doStub.fetch(new Request('http://do/enter', {
      method: 'POST',
      body: JSON.stringify({ userId: user.id, ticketCount: data.tickets })
    }));

    return c.json({
      success: true,
      newBalance: userInfo.tickets - totalCost,
      totalEntries: currentTickets + data.tickets
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

raffleRouter.get('/:id', async (c) => {
  const raffleId = c.req.param('id');

  const raffle = await c.env.DB.prepare(`
    SELECT * FROM raffles WHERE id = ?
  `).bind(raffleId).first();

  if (!raffle) {
    return c.json({ error: 'Raffle not found' }, 404);
  }

  const entries = await c.env.DB.prepare(`
    SELECT u.username, re.ticket_count
    FROM raffle_entries re
    JOIN users u ON re.user_id = u.id
    WHERE re.raffle_id = ?
    ORDER BY re.ticket_count DESC
    LIMIT 100
  `).bind(raffleId).all();

  let winners = null;
  if (raffle.status === 'completed' && raffle.winners) {
    const winnerIds = JSON.parse(raffle.winners);
    const winnerData = await c.env.DB.prepare(`
      SELECT id, username FROM users
      WHERE id IN (${winnerIds.map(() => '?').join(',')})
    `).bind(...winnerIds).all();

    winners = winnerIds.map((id: string, index: number) => {
      const user = winnerData.results.find((u: any) => u.id === id);
      return {
        userId: id,
        username: user?.username || 'Unknown',
        position: index + 1,
        prize: Math.floor(raffle.prize_pool / winnerIds.length)
      };
    });
  }

  return c.json({
    raffle,
    entries: entries.results,
    winners
  });
});

async function handleExpiredRaffles(env: Env) {
  const expiredRaffles = await env.DB.prepare(`
    SELECT * FROM raffles
    WHERE status = 'active' AND end_time < datetime('now')
  `).all();

  for (const raffle of expiredRaffles.results) {
    await processRaffleWinner(env, raffle);
  }
}

async function processRaffleWinner(env: Env, raffle: any) {
  // Get all entries for this raffle
  const entries = await env.DB.prepare(`
    SELECT user_id, ticket_count FROM raffle_entries
    WHERE raffle_id = ?
  `).bind(raffle.id).all();

  if (entries.results.length === 0) {
    // No entries, mark as completed
    await env.DB.prepare(`
      UPDATE raffles SET status = 'completed' WHERE id = ?
    `).bind(raffle.id).run();
    return;
  }

  // Create a weighted array for selection
  const weightedUsers: string[] = [];
  entries.results.forEach((entry: any) => {
    for (let i = 0; i < entry.ticket_count; i++) {
      weightedUsers.push(entry.user_id);
    }
  });

  // Select random winner
  const winnerUserId = weightedUsers[Math.floor(Math.random() * weightedUsers.length)];

  // Award prize to winner
  await env.DB.prepare(`
    UPDATE users SET tickets = tickets + ? WHERE id = ?
  `).bind(raffle.prize_pool, winnerUserId).run();

  // Mark raffle as completed with winner
  await env.DB.prepare(`
    UPDATE raffles SET status = 'completed', winners = ? WHERE id = ?
  `).bind(JSON.stringify([winnerUserId]), raffle.id).run();

  // Log the win
  await env.DB.prepare(`
    INSERT INTO earn_log (id, user_id, amount, source, metadata)
    VALUES (?, ?, ?, 'raffle_win', ?)
  `).bind(
    generateId(),
    winnerUserId,
    raffle.prize_pool,
    JSON.stringify({ raffleId: raffle.id, raffleName: raffle.name })
  ).run();
}

async function ensureActiveRaffles(env: Env) {
  const activeCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM raffles WHERE status = 'active'
  `).first<any>();

  if (activeCount?.count < 3) {
    // Create new raffles to maintain 3 active raffles
    const raffleTypes = [
      {
        name: 'Hourly Jackpot',
        description: 'Win big every hour! The more tickets you enter, the higher your chances',
        prize_pool: 5000,
        max_entries_per_user: 10,
        ticket_cost: 10,
        duration_minutes: 60
      },
      {
        name: 'Daily Mega Prize',
        description: 'Massive daily rewards for the luckiest players',
        prize_pool: 25000,
        max_entries_per_user: 50,
        ticket_cost: 25,
        duration_minutes: 1440
      },
      {
        name: 'Speed Raffle',
        description: 'Quick 15-minute raffle for instant gratification',
        prize_pool: 1000,
        max_entries_per_user: 5,
        ticket_cost: 5,
        duration_minutes: 15
      }
    ];

    const now = new Date();
    const raffleType = raffleTypes[Math.floor(Math.random() * raffleTypes.length)];
    const endTime = new Date(now.getTime() + raffleType.duration_minutes * 60 * 1000);
    const drawTime = new Date(endTime.getTime() + 5 * 60 * 1000);

    await env.DB.prepare(`
      INSERT INTO raffles (
        id, name, description, prize_pool, max_entries_per_user, ticket_cost,
        start_time, end_time, draw_time, status, winner_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      generateId(),
      raffleType.name,
      raffleType.description,
      raffleType.prize_pool,
      raffleType.max_entries_per_user,
      raffleType.ticket_cost,
      now.toISOString(),
      endTime.toISOString(),
      drawTime.toISOString(),
      'active',
      1
    ).run();
  }
}