import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/index.js';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { createLogger } from '@relieflink/logger';
import Redis from 'ioredis';
import { initializeQueues, closeQueues } from './infrastructure/queue.js';

const logger = createLogger({ service: 'volunteer-service', level: config.logLevel });

// Create PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: config.database.url
});

// Create Prisma adapter
const adapter = new PrismaPg(pool as any);

// Create Prisma client with adapter
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Connected to database');

    // Initialize Redis and queues
    const redis = new Redis(config.redis.url);
    const { notificationQueue } = initializeQueues(redis);
    logger.info('Queue producer initialized');

    const app = createApp(prisma, notificationQueue);
    app.listen(config.port, () => {
      logger.info(`Volunteer service running on http://localhost:${config.port}`);
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
    logger.error('Failed to start volunteer service', { error });
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  }
}

main();

