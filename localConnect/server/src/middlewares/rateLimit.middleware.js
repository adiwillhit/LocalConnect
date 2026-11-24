import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from '../config/environment.js';
import { getRedisClient, isRedisAvailable } from '../config/redis.js';

const createRedisStore = (prefix) => {
  if (!isRedisAvailable()) {
    return undefined;
  }

  const client = getRedisClient();
  return new RedisStore({
    prefix,
    sendCommand: (...args) => client.call(...args),
  });
};

const rateLimitHandler = (_req, res) => {
  return res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later',
    errors: [],
  });
};

export const createGlobalRateLimiter = () =>
  rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.isTest,
    store: createRedisStore('rl:global:'),
    handler: rateLimitHandler,
  });

export const createAuthRateLimiter = () =>
  rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.authMax,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.isTest,
    store: createRedisStore('rl:auth:'),
    handler: rateLimitHandler,
  });

