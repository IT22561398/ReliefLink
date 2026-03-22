import Redis, { RedisOptions } from 'ioredis';

export interface CacheConfig extends RedisOptions {
  keyPrefix?: string;
  defaultTtl?: number;
}

/**
 * Create a Redis client instance
 */
export function createRedisClient(config: CacheConfig): Redis {
  const { keyPrefix, defaultTtl, ...redisOptions } = config;

  const client = new Redis({
    ...redisOptions,
    keyPrefix: keyPrefix ? `${keyPrefix}:` : undefined,
    retryStrategy: (times) => {
      if (times > 10) return null;
      return Math.min(times * 100, 3000);
    },
    maxRetriesPerRequest: 3
  });

  client.on('error', (error) => {
    console.error('Redis client error:', error);
  });

  client.on('connect', () => {
    console.log('Redis client connected');
  });

  return client;
}

/**
 * Check Redis health
 */
export async function checkRedisHealth(client: Redis): Promise<{
  status: 'ok' | 'error';
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    await client.ping();
    return {
      status: 'ok',
      latency: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'error',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Graceful shutdown for Redis client
 */
export async function closeRedisClient(client: Redis): Promise<void> {
  await client.quit();
}

export { Redis };
export type { RedisOptions };
