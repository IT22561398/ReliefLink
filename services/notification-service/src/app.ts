import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { createLogger, createRequestLogger, createErrorLogger } from '@relieflink/logger';
import { config } from './config/index.js';
import { PrismaClient, NotificationChannel, DeliveryStatus } from '../generated/client/index.js';
import { z } from 'zod';
import { swaggerSpec } from './swagger.js';

export function createApp(prisma: PrismaClient): Express {
  const app = express();
  const logger = createLogger({ service: 'notification-service', level: config.logLevel });

  app.use(cors());
  app.use(express.json());
  app.use(createRequestLogger(logger));

  const notificationSchema = z.object({
    userId: z.string().min(1),
    message: z.string().min(3),
    channel: z.nativeEnum(NotificationChannel).default(NotificationChannel.in_app)
  });

  const statusEventSchema = z.object({
    requestId: z.string().min(1),
    oldStatus: z.string().min(1),
    newStatus: z.string().min(1),
    changedBy: z.string().min(1)
  });

  // Health
  app.get('/health', (_req, res) => {
    res.json({ service: 'notification-service', status: 'ok', timestamp: new Date().toISOString() });
  });

  // Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Notifications
  app.post('/api/v1/notifications', async (req, res) => {
    const parsed = notificationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } });
      return;
    }

    const notification = await prisma.notification.create({
      data: {
        userId: parsed.data.userId,
        message: parsed.data.message,
        channel: parsed.data.channel,
        deliveryStatus: DeliveryStatus.delivered
      }
    });

    res.status(201).json({ success: true, data: notification });
  });

  app.get('/api/v1/notifications/user/:userId', async (req, res) => {
    const list = await prisma.notification.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: list });
  });

  // Status Events
  app.post('/api/v1/status-events', async (req, res) => {
    const parsed = statusEventSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } });
      return;
    }

    const event = await prisma.statusEvent.create({
      data: {
        requestId: parsed.data.requestId,
        oldStatus: parsed.data.oldStatus,
        newStatus: parsed.data.newStatus,
        changedBy: parsed.data.changedBy
      }
    });

    res.status(201).json({ success: true, data: event });
  });

  app.get('/api/v1/status-events/request/:requestId', async (req, res) => {
    const list = await prisma.statusEvent.findMany({
      where: { requestId: req.params.requestId },
      orderBy: { timestamp: 'desc' }
    });
    res.json({ success: true, data: list });
  });

  app.use(createErrorLogger(logger));
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', { error: err.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  });

  return app;
}
