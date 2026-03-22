import { Queue } from 'bullmq';
import type { JobsOptions } from 'bullmq';
import { Redis } from 'ioredis';

export interface QueueConfig {
  name: string;
  connection: Redis;
  defaultJobOptions?: JobsOptions;
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
    age: 24 * 3600,
    count: 1000
  },
  removeOnFail: {
    age: 7 * 24 * 3600
  }
} satisfies JobsOptions;

/**
 * Create a BullMQ queue
 */
export function createQueue<T>(config: QueueConfig): Queue<T> {
  const options = {
    connection: config.connection as any,
    defaultJobOptions: config.defaultJobOptions
      ? ({ ...DEFAULT_JOB_OPTIONS, ...config.defaultJobOptions } as JobsOptions)
      : DEFAULT_JOB_OPTIONS
  };

  return new Queue<T>(config.name, options) as unknown as Queue<T>;
}

/**
 * Close a queue gracefully
 */
export async function closeQueue(queue: Queue): Promise<void> {
  await queue.close();
}

export { Queue };
