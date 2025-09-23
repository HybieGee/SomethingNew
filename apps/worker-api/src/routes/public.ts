import { Hono } from 'hono';
import type { Env } from '../types';

export const publicRouter = new Hono<{ Bindings: Env }>();

publicRouter.get('/stats', async (c) => {
  try {
    // Get total users
    const userCountResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users'
    ).first();

    // Get total active raffles and prize pools
    const raffleStatsResult = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as active_raffles,
        SUM(prize_pool) as total_prize_pool
      FROM raffles
      WHERE status = 'active'
    `).first();

    // Get total tickets in circulation
    const ticketStatsResult = await c.env.DB.prepare(
      'SELECT SUM(tickets) as total_tickets FROM users'
    ).first();

    // Get recent activity (users who logged in within last 24 hours)
    const activeUsersResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE last_login_at > datetime('now', '-24 hours')
    `).first();

    return c.json({
      totalUsers: userCountResult?.count || 0,
      activeUsers: activeUsersResult?.count || 0,
      activeRaffles: raffleStatsResult?.active_raffles || 0,
      totalPrizePool: raffleStatsResult?.total_prize_pool || 0,
      totalTickets: ticketStatsResult?.total_tickets || 0,
      status: 'live'
    });
  } catch (error: any) {
    console.error('Public stats error:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});