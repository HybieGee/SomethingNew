import type { Context, Next } from 'hono';
import type { Env } from '../types';

interface CacheConfig {
  ttl: number; // Time to live in seconds
  keyGenerator?: (c: Context) => string;
  skipCache?: (c: Context) => boolean;
  varyBy?: string[]; // Headers to vary cache by
}

export function cache(config: CacheConfig) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    // Skip caching for non-GET requests
    if (c.req.method !== 'GET') {
      await next();
      return;
    }

    // Skip if skipCache function returns true
    if (config.skipCache && config.skipCache(c)) {
      await next();
      return;
    }

    const cacheKey = config.keyGenerator
      ? config.keyGenerator(c)
      : `cache:${c.req.url}`;

    try {
      // Try to get from cache
      const cached = await c.env.CACHE.get(cacheKey, 'json') as {
        data: any;
        headers: Record<string, string>;
        timestamp: number;
      } | null;

      if (cached && (Date.now() - cached.timestamp) < (config.ttl * 1000)) {
        // Return cached response
        Object.entries(cached.headers).forEach(([key, value]) => {
          c.header(key, value);
        });
        c.header('X-Cache', 'HIT');
        return c.json(cached.data);
      }

      // Cache miss - execute request
      await next();

      // Cache the response if successful
      if (c.res.status === 200) {
        const responseData = await c.res.clone().json();
        const headers: Record<string, string> = {};

        // Store relevant headers
        c.res.headers.forEach((value, key) => {
          if (key.startsWith('content-') || key === 'cache-control') {
            headers[key] = value;
          }
        });

        await c.env.CACHE.put(
          cacheKey,
          JSON.stringify({
            data: responseData,
            headers,
            timestamp: Date.now()
          }),
          { expirationTtl: config.ttl + 60 } // Add buffer to TTL
        );

        c.header('X-Cache', 'MISS');
      }
    } catch (error) {
      console.error('Cache middleware error:', error);
      // If caching fails, proceed without cache
      await next();
    }
  };
}

// Specific cache configurations
export const leaderboardCache = cache({
  ttl: 300, // 5 minutes
  keyGenerator: (c) => `leaderboard:${c.req.query('season') || 'current'}`,
});

export const profileCache = cache({
  ttl: 30, // 30 seconds
  keyGenerator: (c) => {
    const user = c.get('user');
    return `profile:${user?.id || 'anonymous'}`;
  },
  skipCache: (c) => !c.get('user') // Don't cache if no user
});

export const questsCache = cache({
  ttl: 30, // 30 seconds - short cache for responsive quest states
  keyGenerator: (c) => {
    const user = c.get('user');
    return `quests:${user?.id || 'anonymous'}`;
  },
  skipCache: (c) => !c.get('user') // Don't cache if no user
});

export const solanaCache = cache({
  ttl: 60, // 1 minute for price data
  keyGenerator: () => 'solana:price',
});