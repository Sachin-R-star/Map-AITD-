import { getRedisClient } from '../config/redis';

export class CacheService {
  /**
   * Set cache key with configurable TTL in seconds
   */
  static async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    try {
      const client = getRedisClient();
      if (!client) return false;

      const stringValue = JSON.stringify(value);
      await client.set(key, stringValue, 'EX', ttlSeconds);
      return true;
    } catch (error) {
      console.error(`Cache set failed for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get value from cache by key
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const client = getRedisClient();
      if (!client) return null;

      const data = await client.get(key);
      if (!data) return null;

      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Cache get failed for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete value from cache
   */
  static async del(key: string): Promise<boolean> {
    try {
      const client = getRedisClient();
      if (!client) return false;

      await client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete failed for key ${key}:`, error);
      return false;
    }
  }
}
