import type { Context, Next } from 'hono';
import type { Env } from '../types';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (c: Context) => string; // Custom key generator
  skipSuccessfulRequests?: boolean;
}

export function rateLimit(config: RateLimitConfig) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const key = config.keyGenerator
      ? config.keyGenerator(c)
      : `rate_limit:${c.req.header('cf-connecting-ip') || 'unknown'}`;

    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      // Get current request count from KV
      const cached = await c.env.CACHE.get(`${key}:count`, 'json') as {
        count: number;
        resetTime: number;
      } | null;

      let requestCount = 0;
      let resetTime = now + config.windowMs;

      if (cached && cached.resetTime > now) {
        // Within the current window
        requestCount = cached.count;
        resetTime = cached.resetTime;
      }

      // Check if limit exceeded
      if (requestCount >= config.maxRequests) {
        return c.json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((resetTime - now) / 1000)
        }, 429);
      }

      // Increment counter
      requestCount += 1;

      // Store updated count
      await c.env.CACHE.put(
        `${key}:count`,
        JSON.stringify({ count: requestCount, resetTime }),
        { expirationTtl: Math.ceil(config.windowMs / 1000) + 10 }
      );

      // Add rate limit headers
      c.header('X-RateLimit-Limit', config.maxRequests.toString());
      c.header('X-RateLimit-Remaining', (config.maxRequests - requestCount).toString());
      c.header('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());

      await next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // If rate limiting fails, allow the request to proceed
      await next();
    }
  };
}

// Specific rate limiters for different endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 login attempts per 15 minutes
  keyGenerator: (c) => `auth:${c.req.header('cf-connecting-ip') || 'unknown'}`
});

export const dailyRewardRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxRequests: 5, // 5 attempts per day (generous for retries)
  keyGenerator: (c) => {
    const user = c.get('user');
    return `daily:${user?.id || c.req.header('cf-connecting-ip') || 'unknown'}`;
  }
});

export const generalRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute per IP
  keyGenerator: (c) => `general:${c.req.header('cf-connecting-ip') || 'unknown'}`
});

export const questRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 20, // 20 quest completions per minute
  keyGenerator: (c) => {
    const user = c.get('user');
    return `quest:${user?.id || c.req.header('cf-connecting-ip') || 'unknown'}`;
  }
});