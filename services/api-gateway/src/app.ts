import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createLogger, createRequestLogger, createErrorLogger } from '@relieflink/logger';
import { config } from './config/index.js';
import { rateLimiter } from './middleware/rate-limiter.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { createHealthRoutes } from './health/health.routes.js';
import { proxyRequest } from './proxy/proxy.service.js';

export function createApp(): Express {
  const app = express();
  const logger = createLogger({ service: 'api-gateway', level: config.logLevel });

  app.set('trust proxy', 1);

  app.use(requestIdMiddleware());

  app.use(cors({
    origin: config.cors.origin === '*' ? true : config.cors.origin.split(','),
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Config-Token']
  }));

  app.use(express.json({ limit: '10mb' }));

  app.use(createRequestLogger(logger));

  // Only apply rate limiter in production
  if (config.env === 'production') {
    app.use(rateLimiter());
  }

  app.use(createHealthRoutes());

  app.all('/api/*', async (req: Request, res: Response) => {
    await proxyRequest(req, res);
  });

  app.use(createErrorLogger(logger));

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    });
  });

  return app;
}
