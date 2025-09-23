import { Hono } from 'hono';
import { RegisterSchema, LoginSchema, generateId, GAME_CONFIG } from '../shared';
import type { Env } from '../types';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const authRouter = new Hono<{ Bindings: Env }>();

authRouter.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const data = RegisterSchema.parse(body);

    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(data.username).first();

    if (existingUser) {
      return c.json({ error: 'Username already taken' }, 409);
    }

    const userId = generateId();
    const passwordHash = await hashPassword(data.password);
    const sessionId = generateId();

    await c.env.DB.prepare(`
      INSERT INTO users (id, username, password_hash, solana_address, tickets)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      userId,
      data.username,
      passwordHash,
      data.solanaAddress,
      GAME_CONFIG.INITIAL_TICKETS
    ).run();

    const sessionData = { id: userId, username: data.username };
    await c.env.CACHE.put(
      `session:${sessionId}`,
      JSON.stringify(sessionData),
      { expirationTtl: GAME_CONFIG.SESSION_DURATION / 1000 }
    );

    c.cookie('session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: GAME_CONFIG.SESSION_DURATION / 1000
    });

    return c.json({
      success: true,
      userId,
      username: data.username,
      tickets: GAME_CONFIG.INITIAL_TICKETS
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

authRouter.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const data = LoginSchema.parse(body);

    const user = await c.env.DB.prepare(`
      SELECT id, username, password_hash, tickets, streak_days
      FROM users
      WHERE username = ?
    `).bind(data.username).first();

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const passwordHash = await hashPassword(data.password);
    if (passwordHash !== user.password_hash) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const sessionId = generateId();
    const sessionData = { id: user.id, username: user.username };

    await c.env.CACHE.put(
      `session:${sessionId}`,
      JSON.stringify(sessionData),
      { expirationTtl: GAME_CONFIG.SESSION_DURATION / 1000 }
    );

    await c.env.DB.prepare(
      'UPDATE users SET last_login_at = datetime("now") WHERE id = ?'
    ).bind(user.id).run();

    c.cookie('session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: GAME_CONFIG.SESSION_DURATION / 1000
    });

    return c.json({
      success: true,
      userId: user.id,
      username: user.username,
      tickets: user.tickets,
      streakDays: user.streak_days
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

authRouter.post('/logout', async (c) => {
  const sessionCookie = c.req.cookie('session');

  if (sessionCookie) {
    await c.env.CACHE.delete(`session:${sessionCookie}`);
  }

  c.cookie('session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 0
  });

  return c.json({ success: true });
});