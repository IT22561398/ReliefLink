import { Redis } from 'ioredis';
import { createQueue, QUEUE_NAMES } from '@relieflink/queue';
import type { NotificationJobData } from '@relieflink/queue';
import { createLogger } from '@relieflink/logger';

const logger = createLogger({ service: 'volunteer-service' });

export function initializeQueues(redis: Redis) {
  const notificationQueue = createQueue<NotificationJobData>({
    name: QUEUE_NAMES.NOTIFICATION,
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { age: 24 * 3600 }
    }
  });

  logger.info('Volunteer Service: Notification queue initialized');

  return { notificationQueue };
}

export async function closeQueues(notificationQueue: any) {
  try {
    await notificationQueue.close();
    logger.info('Volunteer Service: Queues closed');
  } catch (error) {
    logger.error('Failed to close queues', { error });
    throw error;
  }
}
