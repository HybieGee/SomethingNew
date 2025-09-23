import { Hono } from 'hono';
import { RegisterSchema, LoginSchema } from '@raffle-arcade/shared';
import { generateId, generateRecoveryCode, GAME_CONFIG } from '@raffle-arcade/shared';
import type { Env } from '../types';

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
    const recoveryCode = generateRecoveryCode();
    const sessionId = generateId();

    await c.env.DB.prepare(`
      INSERT INTO users (id, username, solana_address, tickets, recovery_code)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      userId,
      data.username,
      data.solanaAddress,
      GAME_CONFIG.INITIAL_TICKETS,
      recoveryCode
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
      recoveryCode,
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
      SELECT id, username, tickets, streak_days
      FROM users
      WHERE username = ? AND recovery_code = ?
    `).bind(data.username, data.recoveryCode).first();

    if (!user) {
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