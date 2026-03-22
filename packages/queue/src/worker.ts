import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';

export interface WorkerConfig {
  name: string;
  connection: Redis;
  concurrency?: number;
  limiter?: {
    max: number;
    duration: number;
  };
}

/**
 * Create a BullMQ worker
 */
export function createWorker<T, R>(
  config: WorkerConfig,
  processor: (job: Job<T>) => Promise<R>
): Worker<T, R> {
  const options = {
    connection: config.connection as any,
    concurrency: config.concurrency || 5,
    limiter: config.limiter
  };

  const worker = new Worker<T, R>(config.name, processor, options);

  // Default event handlers
  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`Job ${job?.id} failed:`, error);
  });

  worker.on('error', (error) => {
    console.error('Worker error:', error);
  });

  return worker;
}

/**
 * Close a worker gracefully
 */
export async function closeWorker(worker: Worker): Promise<void> {
  await worker.close();
}

export { Worker, Job };
