import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { EnterRaffleSchema } from './shared';
import type { Env } from '../types';

export const raffleRouter = new Hono<{ Bindings: Env }>();

raffleRouter.get('/next', async (c) => {
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

      return {
        ...raffle,
        entryCount: entries?.entry_count || 0,
        totalTickets: entries?.total_tickets || 0,
        timeRemaining: new Date(raffle.end_time).getTime() - Date.now()
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