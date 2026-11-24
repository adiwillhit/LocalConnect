import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { env } from './config/environment.js';
import { isRedisAvailable } from './config/redis.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { createGlobalRateLimiter } from './middlewares/rateLimit.middleware.js';
import authRoutes from './routes/auth.routes.js';
import commentRoutes from './routes/comment.routes.js';
import communityRoutes from './routes/community.routes.js';
import feedRoutes from './routes/feed.routes.js';
import postRoutes from './routes/post.routes.js';
import userRoutes from './routes/user.routes.js';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(mongoSanitize());

  if (!env.isTest) {
    app.use(morgan(env.isProduction ? 'combined' : 'dev'));
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'LocalConnect API is healthy',
      data: {
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        redis: isRedisAvailable() ? 'connected' : 'disconnected',
      },
    });
  });

  app.use('/api', createGlobalRateLimiter());

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/communities', communityRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/feed', feedRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

