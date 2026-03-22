import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

export interface QueueConfig {
  name: string;
  connection: Redis;
  defaultJobOptions?: {
    attempts?: number;
    backoff?: {
      type: string;
      delay: number;
    };
    removeOnComplete?: {
      age?: number;
      count?: number;
    };
    removeOnFail?: {
      age?: number;
    };
  };
}

/**
 * Queue names for the application
 */
export const QUEUE_NAMES = {
  NOTIFICATION: 'notification',
  EMAIL: 'email',
  SMS: 'sms',
  AUDIT: 'audit',
  MATCHING: 'matching'
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/**
 * Default job options
 */
export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000
  },
  removeOnComplete: {
    age: 24 * 3600, // Keep completed jobs for 24 hours
    count: 1000
  },
  removeOnFail: {
    age: 7 * 24 * 3600 // Keep failed jobs for 7 days
  }
};

/**
 * Create a BullMQ queue
 */
export function createQueue<T>(config: QueueConfig): Queue<T> {
  const options = {
    connection: config.connection,
    defaultJobOptions: {
      ...DEFAULT_JOB_OPTIONS,
      ...config.defaultJobOptions
    }
  };

  return new Queue<T>(config.name, options);
}

/**
 * Close a queue gracefully
 */
export async function closeQueue(queue: Queue): Promise<void> {
  await queue.close();
}

export { Queue };
