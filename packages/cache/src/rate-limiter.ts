import Redis from 'ioredis';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

/**
 * Redis-based rate limiter using sliding window algorithm
 */
export class RateLimiter {
  private client: Redis;
  private config: RateLimitConfig;

  constructor(client: Redis, config: RateLimitConfig) {
    this.client = client;
    this.config = {
      keyPrefix: 'ratelimit',
      ...config
    };
  }

  /**
   * Check if request is allowed and increment counter
   */
  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = `${this.config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Use Redis transaction to atomically update and check
    const pipeline = this.client.pipeline();

    // Remove old entries outside the window
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Add current request
    pipeline.zadd(key, now.toString(), `${now}-${Math.random()}`);

    // Count requests in window
    pipeline.zcard(key);

    // Set expiry on the key
    pipeline.pexpire(key, this.config.windowMs);

    const results = await pipeline.exec();
    const count = (results?.[2]?.[1] as number) || 0;

    const resetAt = new Date(now + this.config.windowMs);
    const remaining = Math.max(0, this.config.maxRequests - count);
    const allowed = count <= this.config.maxRequests;

    return {
      allowed,
      remaining,
      resetAt,
      retryAfter: allowed ? undefined : Math.ceil(this.config.windowMs / 1000)
    };
  }

  /**
   * Get current count without incrementing
   */
  async getCurrentCount(identifier: string): Promise<number> {
    const key = `${this.config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    await this.client.zremrangebyscore(key, 0, windowStart);
    return this.client.zcard(key);
  }

  /**
   * Reset rate limit for an identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = `${this.config.keyPrefix}:${identifier}`;
    await this.client.del(key);
  }
}

/**
 * Express middleware factory for rate limiting
 */
export function createRateLimitMiddleware(limiter: RateLimiter, keyFn?: (req: unknown) => string) {
  return async (req: unknown, res: { status: (code: number) => { json: (body: unknown) => void }; setHeader: (name: string, value: string | number) => void }, next: () => void) => {
    const key = keyFn ? keyFn(req) : ((req as { ip?: string }).ip || 'unknown');
    const result = await limiter.checkLimit(key);

    res.setHeader('X-RateLimit-Limit', limiter['config'].maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt.getTime() / 1000));

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter || 60);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests, please try again later',
          retryAfter: result.retryAfter
        }
      });
      return;
    }

    next();
  };
}
