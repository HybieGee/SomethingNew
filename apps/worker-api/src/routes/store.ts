import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { PurchaseItemSchema } from '../shared/index';
import type { Env } from '../types';

export const storeRouter = new Hono<{ Bindings: Env }>();

storeRouter.get('/', async (c) => {
  const items = await c.env.DB.prepare(`
    SELECT * FROM store_items
    WHERE available = true
    ORDER BY type, cost
  `).all();

  return c.json({ items: items.results });
});

storeRouter.post('/purchase', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const data = PurchaseItemSchema.parse(body);

    const item = await c.env.DB.prepare(`
      SELECT * FROM store_items
      WHERE id = ? AND available = true
    `).bind(data.itemId).first<any>();

    if (!item) {
      return c.json({ error: 'Item not found' }, 404);
    }

    const userInfo = await c.env.DB.prepare(
      'SELECT tickets FROM users WHERE id = ?'
    ).bind(user.id).first<any>();

    if (userInfo.tickets < item.cost) {
      return c.json({ error: 'Insufficient tickets' }, 400);
    }

    const alreadyOwned = await c.env.DB.prepare(`
      SELECT id FROM user_purchases
      WHERE user_id = ? AND item_id = ?
    `).bind(user.id, data.itemId).first();

    if (alreadyOwned && item.type === 'badge') {
      return c.json({ error: 'Already owned' }, 409);
    }

    await c.env.DB.batch([
      c.env.DB.prepare(`
        UPDATE users SET tickets = tickets - ? WHERE id = ?
      `).bind(item.cost, user.id),

      c.env.DB.prepare(`
        INSERT INTO user_purchases (id, user_id, item_id, cost)
        VALUES (?, ?, ?, ?)
      `).bind(crypto.randomUUID(), user.id, data.itemId, item.cost),

      c.env.DB.prepare(`
        INSERT INTO earn_log (id, user_id, amount, source, metadata)
        VALUES (?, ?, ?, 'store_purchase', ?)
      `).bind(
        crypto.randomUUID(),
        user.id,
        -item.cost,
        JSON.stringify({ itemId: data.itemId, itemName: item.name })
      )
    ]);

    if (item.type === 'badge' && item.metadata) {
      const metadata = JSON.parse(item.metadata);
      if (metadata.badgeId) {
        await c.env.DB.prepare(`
          INSERT INTO user_badges (user_id, badge_id)
          VALUES (?, ?)
        `).bind(user.id, metadata.badgeId).run();
      }
    }

    if (item.type === 'boost') {
      const boostEnd = new Date();
      boostEnd.setHours(boostEnd.getHours() + 1);

      await c.env.DB.prepare(`
        INSERT INTO boosts (id, type, multiplier, start_time, end_time, source)
        VALUES (?, 'personal', 2.0, datetime('now'), ?, ?)
      `).bind(
        crypto.randomUUID(),
        boostEnd.toISOString(),
        `user:${user.id}`
      ).run();
    }

    return c.json({
      success: true,
      newBalance: userInfo.tickets - item.cost,
      item
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});