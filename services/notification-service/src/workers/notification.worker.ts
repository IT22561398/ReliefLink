import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { PrismaClient } from '../../generated/client/index.js';
import { createLogger } from '@relieflink/logger';
import type { NotificationJobData } from '@relieflink/queue';

const logger = createLogger({ service: 'notification-service' });

export function createNotificationWorker(redis: Redis, prisma: PrismaClient): Worker {
  try {
    const queueName = 'notification';

    const processor = async (job: Job<NotificationJobData>) => {
      try {
        logger.debug('Processing notification job', { jobId: job.id, userId: job.data.userId });

        // Create notification in database
        const notification = await prisma.notification.create({
          data: {
            userId: job.data.userId,
            message: job.data.message,
            channel: job.data.channel,
            deliveryStatus: 'delivered',
            metadata: job.data.metadata
          } as any
        });

        logger.info('Notification processed', { jobId: job.id, notificationId: notification.id, userId: job.data.userId });
        return { success: true, notificationId: notification.id };
      } catch (error) {
        logger.error('Failed to process notification', { jobId: job.id, userId: job.data.userId, error });
        throw error;
      }
    };

    const worker = new Worker<NotificationJobData>(queueName, processor, {
      connection: redis as any,
      concurrency: 5,
      limiter: {
        max: 100,
        duration: 60000
      }
    });

    // Event handlers
    worker.on('completed', (job) => {
      logger.debug(`Job ${job?.id} completed successfully`);
    });

    worker.on('failed', (job, error) => {
      const attempts = job?.attemptsMade || 0;
      logger.warn(`Job ${job?.id} failed (attempt ${attempts}):`, { error: error?.message });
    });

    worker.on('error', (error) => {
      logger.error('Worker error:', { error: error?.message });
    });

    logger.info('Notification queue worker created and listening');
    return worker;
  } catch (error) {
    logger.error('Failed to create notification worker', {
      error: error instanceof Error ? error.message : JSON.stringify(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}


