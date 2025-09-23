import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRouter } from './routes/auth';
import { profileRouter } from './routes/profile';
import { questRouter } from './routes/quests';
import { raffleRouter } from './routes/raffles';
import { storeRouter } from './routes/store';
import { adminRouter } from './routes/admin';
import { publicRouter } from './routes/public';
import { RaffleDO } from './durable-objects/RaffleDO';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: (origin) => {
    // Allow any localhost or pages.dev domain
    if (!origin) return '*';
    if (origin.includes('localhost') ||
        origin.includes('pages.dev') ||
        origin.includes('127.0.0.1')) {
      return origin;
    }
    return false;
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

app.use('*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  await next();
});

app.get('/', (c) => c.json({
  name: 'RAFFLE Arcade API',
  version: '1.0.0',
  status: 'operational'
}));

app.route('/auth', authRouter);
app.route('/', profileRouter);
app.route('/quests', questRouter);
app.route('/raffles', raffleRouter);
app.route('/storefront', storeRouter);
app.route('/admin', adminRouter);
app.route('/public', publicRouter);

app.onError((err, c) => {
  console.error(`Error: ${err.message}`, err.stack);
  return c.json({ error: 'Internal server error' }, 500);
});

export { RaffleDO };
export default app;