import { Queue, Worker } from 'bullmq';
import { env } from '../config/environment.js';
import { isRedisAvailable } from '../config/redis.js';
import { Community } from '../models/Community.js';

const QUEUE_NAME = 'notifications';

let notificationQueue = null;
let notificationWorker = null;

const getBullConnection = () => ({
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password,
  maxRetriesPerRequest: null,
});

export const getNotificationQueue = () => {
  if (env.isTest || !isRedisAvailable()) {
    return null;
  }

  if (!notificationQueue) {
    notificationQueue = new Queue(QUEUE_NAME, {
      connection: getBullConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });

    notificationQueue.on('error', (err) => {
      console.warn('Notification queue error:', err.message);
    });
  }

  return notificationQueue;
};

export const enqueuePostNotification = async ({ postId, communityId, authorId, title }) => {
  const queue = getNotificationQueue();
  if (!queue) {
    return { queued: false, reason: 'Redis/Queue unavailable or test mode' };
  }

  try {
    const job = await queue.add('new-post-notification', {
      postId: postId.toString(),
      communityId: communityId.toString(),
      authorId: authorId.toString(),
      title,
      createdAt: new Date().toISOString(),
    });
    return { queued: true, jobId: job.id };
  } catch (err) {
    console.warn('Failed to enqueue notification job:', err.message);
    return { queued: false, reason: err.message };
  }
};

export const startNotificationWorker = () => {
  if (env.isTest || !isRedisAvailable() || notificationWorker) {
    return notificationWorker;
  }

  notificationWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { postId, communityId, authorId, title } = job.data;
      const community = await Community.findById(communityId)
        .select('name members')
        .lean();

      if (!community) {
        return { notifiedCount: 0, reason: 'Community not found' };
      }

      const recipients = (community.members || []).filter(
        (memberId) => memberId.toString() !== authorId
      );

      console.log(
        `[NotificationWorker] Job ${job.id}: Notifying ${recipients.length} members of "${community.name}" about post "${title}" (${postId})`
      );

      return { notifiedCount: recipients.length };
    },
    {
      connection: getBullConnection(),
      concurrency: 5,
    }
  );

  notificationWorker.on('completed', (job, result) => {
    console.log(`[NotificationWorker] Job ${job.id} completed:`, result);
  });

  notificationWorker.on('failed', (job, err) => {
    console.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message);
  });

  return notificationWorker;
};

export const stopNotificationWorker = async () => {
  if (notificationWorker) {
    await notificationWorker.close();
    notificationWorker = null;
  }
  if (notificationQueue) {
    await notificationQueue.close();
    notificationQueue = null;
  }
};

