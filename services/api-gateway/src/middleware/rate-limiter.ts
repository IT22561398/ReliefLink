import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@relieflink/logger';
import { config } from '../config/index.js';

const logger = createLogger({ service: 'api-gateway', level: config.logLevel });

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

function getClientKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ip.trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime <= now) {
      store.delete(key);
    }
  }
}

setInterval(cleanupExpiredEntries, 60000);

export function rateLimiter(
  windowMs: number = config.rateLimit.windowMs,
  maxRequests: number = config.rateLimit.maxRequests
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = getClientKey(req);
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || entry.resetTime <= now) {
      entry = { count: 1, resetTime: now + windowMs };
      store.set(key, entry);
    } else {
      entry.count++;
    }

    const remaining = Math.max(0, maxRequests - entry.count);
    const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (entry.count > maxRequests) {
      logger.warn('Rate limit exceeded', { clientIp: key, count: entry.count, path: req.path });
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          retryAfter: resetSeconds
        }
      });
      return;
    }

    next();
  };
}
