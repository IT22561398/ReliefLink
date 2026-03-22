import bcrypt from 'bcryptjs';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/index.js';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { createLogger } from '@relieflink/logger';

const logger = createLogger({ service: 'auth-service', level: config.logLevel });

// Create PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: config.database.url
});

// Create Prisma adapter
const adapter = new PrismaPg(pool as any);

// Create Prisma client with adapter
const prisma = new PrismaClient({ adapter });

async function seedAdmin(): Promise<void> {
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'coordinator@relieflink.local' },
    update: {},
    create: {
      fullName: 'System Coordinator',
      email: 'coordinator@relieflink.local',
      phone: '+94000000000',
      passwordHash,
      role: 'coordinator',
      district: 'Colombo',
      city: 'Colombo'
    }
  });
  logger.info('Admin user seeded');
}

async function main(): Promise<void> {
  try {
    // Connect to database
    await prisma.$connect();
    logger.info('Connected to database');

    // Seed admin user
    await seedAdmin();

    // Create and start app
    const app = createApp(prisma);

    app.listen(config.port, () => {
      logger.info(`Auth service running on http://localhost:${config.port}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down...');
      await prisma.$disconnect();
      await pool.end();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start auth service', { error });
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  }
}

main();
