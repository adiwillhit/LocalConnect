import { getRedisClient, isRedisAvailable } from '../config/redis.js';

export const cacheService = {
  async get(key) {
    if (!isRedisAvailable()) {
      return null;
    }

    try {
      const client = getRedisClient();
      const raw = await client.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async set(key, value, ttlSeconds = 120) {
    if (!isRedisAvailable()) {
      return false;
    }

    try {
      const client = getRedisClient();
      await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return true;
    } catch {
      return false;
    }
  },

  async del(key) {
    if (!isRedisAvailable()) {
      return false;
    }

    try {
      const client = getRedisClient();
      await client.del(key);
      return true;
    } catch {
      return false;
    }
  },

  async delByPattern(pattern) {
    if (!isRedisAvailable()) {
      return false;
    }

    try {
      const client = getRedisClient();
      let cursor = '0';
      do {
        const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await client.del(...keys);
        }
      } while (cursor !== '0');
      return true;
    } catch {
      return false;
    }
  },
};

