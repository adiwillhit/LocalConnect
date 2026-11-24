import Redis from 'ioredis';
import { env } from './environment.js';

let redisClient = null;
let redisReady = false;

export const initRedis = () => {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis({
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy(times) {
      if (env.isTest && times > 2) {
        return null;
      }
      return Math.min(times * 200, 3000);
    },
    lazyConnect: true,
  });

  redisClient.on('ready', () => {
    redisReady = true;
    if (!env.isTest) {
      console.log(`Redis connected: ${env.redis.host}:${env.redis.port}`);
    }
  });

  redisClient.on('close', () => {
    redisReady = false;
  });

  redisClient.on('end', () => {
    redisReady = false;
  });

  redisClient.on('error', (err) => {
    redisReady = false;
    if (!env.isTest) {
      console.warn('Redis unavailable:', err.message);
    }
  });

  return redisClient;
};

export const connectRedis = async () => {
  const client = initRedis();
  if (client.status === 'wait') {
    try {
      await client.connect();
    } catch (err) {
      redisReady = false;
      if (!env.isTest) {
        console.warn('Initial Redis connection failed, continuing without cache:', err.message);
      }
    }
  }
  return client;
};

export const getRedisClient = () => redisClient;

export const isRedisAvailable = () => Boolean(redisClient && redisReady && redisClient.status === 'ready');

export const disconnectRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    } finally {
      redisReady = false;
      redisClient = null;
    }
  }
};

