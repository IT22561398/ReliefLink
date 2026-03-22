import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { createLogger, createRequestLogger, createErrorLogger } from '@relieflink/logger';
import { config } from './config/index.js';
import { createAuthRoutes, createUserRoutes } from './routes/index.js';
import { AuthController, UserController } from './controllers/index.js';
import { AuthService, UserService } from './services/index.js';
import { UserRepository } from './repositories/index.js';
import { PrismaClient } from '../generated/client/index.js';
import { swaggerSpec } from './swagger.js';

export function createApp(prisma: PrismaClient): Express {
  const app = express();
  const logger = createLogger({ service: 'auth-service', level: config.logLevel });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(createRequestLogger(logger));

  // Initialize layers
  const userRepository = new UserRepository(prisma);
  const authService = new AuthService(userRepository);
  const userService = new UserService(userRepository);
  const authController = new AuthController(authService);
  const userController = new UserController(userService);

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      service: 'auth-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Routes
  app.use('/api/v1/auth', createAuthRoutes(authController));
  app.use('/api/v1/users', createUserRoutes(userController));

  // Error logging middleware
  app.use(createErrorLogger(logger));

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: config.env === 'production' ? 'Internal server error' : err.message
      }
    });
  });

  return app;
}

