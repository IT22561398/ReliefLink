import { Router } from 'express';
import type { AuthenticatedRequest } from '@relieflink/auth-middleware';
import { createAuthMiddleware } from '@relieflink/auth-middleware';
import { RequestController } from '../controllers/request.controller.js';
import { config } from '../config/index.js';

export function createRequestRoutes(requestController: RequestController): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware({ secret: config.jwt.secret });

  router.use(authMiddleware);

  router.post('/', (req, res, next) => requestController.createRequest(req as AuthenticatedRequest, res, next));
  router.get('/', (req, res, next) => requestController.getRequests(req as AuthenticatedRequest, res, next));
  router.get('/:id', (req, res, next) => requestController.getRequestById(req as AuthenticatedRequest, res, next));
  router.patch('/:id', (req, res, next) => requestController.updateRequest(req as AuthenticatedRequest, res, next));
  router.patch('/:id/status', (req, res, next) => requestController.updateRequestStatus(req as AuthenticatedRequest, res, next));

  return router;
}
