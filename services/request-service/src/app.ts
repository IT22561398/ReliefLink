import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { createLogger, createRequestLogger, createErrorLogger } from '@relieflink/logger';
import { config } from './config/index.js';
import { createRequestRoutes } from './routes/index.js';
import { RequestController } from './controllers/index.js';
import { RequestService } from './services/index.js';
import { NotificationQueueClient } from './infrastructure/queue-client.js';
import { RequestRepository } from './repositories/index.js';
import { PrismaClient } from '../generated/client/index.js';
import { swaggerSpec } from './swagger.js';
import type { Queue } from 'bullmq';
import type { NotificationJobData } from '@relieflink/queue';

export function createApp(prisma: PrismaClient, notificationQueue: Queue<NotificationJobData>): Express {
  const app = express();
  const logger = createLogger({ service: 'request-service', level: config.logLevel });

  app.use(cors());
  app.use(express.json());
  app.use(createRequestLogger(logger));

  // Initialize layers
  const requestRepository = new RequestRepository(prisma);
  const notificationQueueClient = new NotificationQueueClient(notificationQueue);
  const requestService = new RequestService(requestRepository, notificationQueueClient);
  const requestController = new RequestController(requestService);

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ service: 'request-service', status: 'ok', timestamp: new Date().toISOString() });
  });

  // Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Routes
  app.use('/api/v1/requests', createRequestRoutes(requestController));

  app.use(createErrorLogger(logger));

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: config.env === 'production' ? 'Internal server error' : err.message } });
  });

  return app;
}

