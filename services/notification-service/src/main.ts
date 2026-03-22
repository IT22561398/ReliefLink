import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Redis } from 'ioredis';
import { PrismaClient } from '../generated/client/index.js';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { createLogger } from '@relieflink/logger';
import { createNotificationWorker } from './workers/notification.worker.js';
import type { Worker } from 'bullmq';

const logger = createLogger({ service: 'notification-service', level: config.logLevel });

// Create PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: config.database.url
});

// Create Prisma adapter
const adapter = new PrismaPg(pool as any);

// Create Prisma client with adapter
const prisma = new PrismaClient({ adapter });

// Create Redis connection for general use
const redis = new Redis(config.redis.url);

// Create separate Redis connection for BullMQ worker (must have maxRetriesPerRequest: null)
const redisForWorker = new Redis(config.redis.url, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

let notificationWorker: Worker;

async function main() {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    await redis.ping();
    logger.info('Redis connected');

    // Initialize notification queue worker
    notificationWorker = createNotificationWorker(redisForWorker, prisma);
    logger.info('Notification queue worker started');

    const app = createApp(prisma);
    const server = app.listen(config.port, () => {
      logger.info(`Notification service running on http://localhost:${config.port}`, {
        env: config.env,
        port: config.port
      });
      logger.info('Queue worker listening for notification jobs...');
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);

      server.close(async () => {
        logger.info('HTTP server closed');
        if (notificationWorker) {
          await notificationWorker.close();
          logger.info('Queue worker closed');
        }
        await redis.quit();
        await redisForWorker.quit();
        logger.info('Redis disconnected');
        await prisma.$disconnect();
        await pool.end();
        logger.info('Database disconnected');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start notification service', {
      error: error instanceof Error ? error.message : JSON.stringify(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    if (notificationWorker) {
      await notificationWorker.close();
    }
    await redis.quit();
    await redisForWorker.quit();
    await pool.end();
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Fatal error', { error });
  process.exit(1);
});
