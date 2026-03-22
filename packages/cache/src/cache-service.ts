import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

/**
 * Cache service for Redis operations
 */
export class CacheService {
  private client: Redis;
  private defaultTtl: number;

  constructor(client: Redis, defaultTtl: number = 3600) {
    this.client = client;
    this.defaultTtl = defaultTtl;
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const expiry = ttl ?? this.defaultTtl;

    if (expiry > 0) {
      await this.client.setex(key, expiry, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    const result = await this.client.del(key);
    return result > 0;
  }

  /**
   * Delete multiple keys by pattern
   */
  async deleteByPattern(pattern: string): Promise<number> {
    const keys = await this.client.keys(pattern);
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * Cache-aside pattern: get from cache or fetch and cache
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Increment a counter
   */
  async increment(key: string, by: number = 1): Promise<number> {
    return this.client.incrby(key, by);
  }

  /**
   * Decrement a counter
   */
  async decrement(key: string, by: number = 1): Promise<number> {
    return this.client.decrby(key, by);
  }
}
