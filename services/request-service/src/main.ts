import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Redis } from 'ioredis';
import { PrismaClient } from '../generated/client/index.js';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { createLogger } from '@relieflink/logger';
import { initializeQueues, closeQueues } from './infrastructure/queue.js';

const logger = createLogger({ service: 'request-service', level: config.logLevel });

// Create PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: config.database.url
});

// Create Prisma adapter
const adapter = new PrismaPg(pool as any);

// Create Prisma client with adapter
const prisma = new PrismaClient({ adapter });

// Create Redis connection
const redis = new Redis(config.redis.url);

async function main(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Connected to database');

    await redis.ping();
    logger.info('Connected to Redis');

    const { notificationQueue } = initializeQueues(redis);

    const app = createApp(prisma, notificationQueue);

    app.listen(config.port, () => {
      logger.info(`Request service running on http://localhost:${config.port}`);
      logger.info('Queue producer ready - notifications will be queued asynchronously');
    });

    const shutdown = async () => {
      logger.info('Shutting down...');
      await closeQueues(notificationQueue);
      await redis.quit();
      await prisma.$disconnect();
      await pool.end();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start request service', { error });
    await redis.quit();
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  }
}

main();
