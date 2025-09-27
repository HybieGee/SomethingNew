import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRouter } from './routes/auth';
import { profileRouter } from './routes/profile';
import { questRouter } from './routes/quests';
import { raffleRouter } from './routes/raffles';
import { storeRouter } from './routes/store';
import { adminRouter } from './routes/admin';
import { publicRouter } from './routes/public';
import { seedRouter } from './routes/seed';
import { factionRouter } from './routes/factions';
import { bugRouter } from './routes/bugs';
import { conversionRouter } from './routes/conversion';
import { stakingRouter } from './routes/staking';
import { premiumRouter } from './routes/premium';
import { generalRateLimit } from './middleware/rateLimit';
import { RaffleDO } from './durable-objects/RaffleDO';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: (origin) => {
    // Allow any localhost, pages.dev, or our specific domains
    if (!origin) return '*';
    if (origin.includes('localhost') ||
        origin.includes('pages.dev') ||
        origin.includes('cloudflare') ||
        origin.includes('127.0.0.1') ||
        origin === 'https://paircade.xyz' ||
        origin === 'http://paircade.xyz') {
      return origin;
    }
    return false;
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposeHeaders: ['Set-Cookie']
}));

// Apply general rate limiting to all routes except static/health check
app.use('*', (c, next) => {
  if (c.req.path === '/' && c.req.method === 'GET') {
    return next(); // Skip rate limiting for health check
  }
  return generalRateLimit(c, next);
});

app.use('*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  await next();
});

app.get('/', (c) => c.json({
  name: 'PairCade API',
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
app.route('/seed', seedRouter);
app.route('/factions', factionRouter);
app.route('/bugs', bugRouter);
app.route('/conversion', conversionRouter);
app.route('/staking', stakingRouter);
app.route('/premium', premiumRouter);

app.onError((err, c) => {
  console.error(`Error: ${err.message}`, err.stack);
  return c.json({ error: 'Internal server error' }, 500);
});

export { RaffleDO };
export default app;