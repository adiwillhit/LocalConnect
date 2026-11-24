import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/environment.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { startNotificationWorker, stopNotificationWorker } from './jobs/notification.worker.js';

const startServer = async () => {
  try {
    await connectDatabase();
    await connectRedis();
    startNotificationWorker();

    const app = createApp();
    const server = app.listen(env.port, () => {
      console.log(`LocalConnect server running in ${env.nodeEnv} mode on port ${env.port}`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await stopNotificationWorker();
        await disconnectRedis();
        await disconnectDatabase();
        console.log('Server shut down cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

