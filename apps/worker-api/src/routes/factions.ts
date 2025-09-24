import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { generateId } from '../shared/index';
import type { Env } from '../types';

export const factionRouter = new Hono<{ Bindings: Env }>();

// Get all available factions
factionRouter.get('/', async (c) => {
  try {
    const factions = await c.env.DB.prepare(`
      SELECT id, name, symbol, description, bonus_multiplier, color,
        (SELECT COUNT(*) FROM user_factions WHERE faction_id = factions.id) as member_count
      FROM factions
      ORDER BY name
    `).all();

    return c.json({ factions: factions.results });
  } catch (error: any) {
    console.error('Get factions error:', error);
    return c.json({ error: 'Failed to get factions', details: error.message }, 500);
  }
});

// Join a faction
factionRouter.post('/join', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { factionId } = body;

    if (!factionId) {
      return c.json({ error: 'Faction ID is required' }, 400);
    }

    // Check if faction exists
    const faction = await c.env.DB.prepare(`
      SELECT id, name FROM factions WHERE id = ?
    `).bind(factionId).first();

    if (!faction) {
      return c.json({ error: 'Faction not found' }, 404);
    }

    // Check if user is already in a faction
    const existingFaction = await c.env.DB.prepare(`
      SELECT faction_id FROM user_factions WHERE user_id = ?
    `).bind(user.id).first();

    if (existingFaction) {
      return c.json({ error: 'You are already in a faction' }, 409);
    }

    // Join the faction
    await c.env.DB.prepare(`
      INSERT INTO user_factions (user_id, faction_id)
      VALUES (?, ?)
    `).bind(user.id, factionId).run();

    return c.json({
      success: true,
      message: `Joined ${faction.name} faction!`,
      factionId
    });
  } catch (error: any) {
    console.error('Join faction error:', error);
    return c.json({ error: 'Failed to join faction', details: error.message }, 500);
  }
});

// Get user's faction info
factionRouter.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    const userFaction = await c.env.DB.prepare(`
      SELECT f.id, f.name, f.symbol, f.description, f.bonus_multiplier, f.color, uf.joined_at,
        (SELECT COUNT(*) FROM user_factions WHERE faction_id = f.id) as member_count
      FROM user_factions uf
      JOIN factions f ON uf.faction_id = f.id
      WHERE uf.user_id = ?
    `).bind(user.id).first();

    if (!userFaction) {
      return c.json({ faction: null });
    }

    return c.json({ faction: userFaction });
  } catch (error: any) {
    console.error('Get user faction error:', error);
    return c.json({ error: 'Failed to get user faction', details: error.message }, 500);
  }
});

// Leave current faction (optional feature)
factionRouter.post('/leave', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    const result = await c.env.DB.prepare(`
      DELETE FROM user_factions WHERE user_id = ?
    `).bind(user.id).run();

    if (result.changes === 0) {
      return c.json({ error: 'You are not in any faction' }, 404);
    }

    return c.json({ success: true, message: 'Left faction successfully' });
  } catch (error: any) {
    console.error('Leave faction error:', error);
    return c.json({ error: 'Failed to leave faction', details: error.message }, 500);
  }
});