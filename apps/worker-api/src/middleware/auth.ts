import { Context, Next } from 'hono';
import type { Env, SessionUser } from '../types';

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const sessionCookie = c.req.cookie('session');

  if (!sessionCookie) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const sessionData = await c.env.CACHE.get(`session:${sessionCookie}`, 'json') as SessionUser;

    if (!sessionData) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    c.set('user', sessionData);
    await next();
  } catch (error) {
    return c.json({ error: 'Session error' }, 401);
  }
}

export async function adminMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Admin authentication required' }, 401);
  }

  const token = authHeader.substring(7);

  if (token !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Invalid admin token' }, 403);
  }

  await next();
}