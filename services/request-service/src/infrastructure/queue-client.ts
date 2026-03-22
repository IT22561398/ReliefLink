import { Queue } from 'bullmq';
import type { NotificationJobData } from '@relieflink/queue';
import { createLogger } from '@relieflink/logger';

const logger = createLogger({ service: 'request-service' });

export class NotificationQueueClient {
  constructor(private notificationQueue: Queue<NotificationJobData>) {}

  async queueNotification(data: NotificationJobData): Promise<void> {
    try {
      const job = await this.notificationQueue.add(
        `notification-${data.userId}`,
        data,
        {
          jobId: `${data.userId}-${Date.now()}`,
          removeOnComplete: { age: 24 * 3600 }
        }
      );
      logger.debug('Notification queued', { jobId: job.id, userId: data.userId });
    } catch (error) {
      logger.error('Failed to queue notification', { error, userId: data.userId });
      // Don't throw - allow request to succeed even if queueing fails
    }
  }
}
