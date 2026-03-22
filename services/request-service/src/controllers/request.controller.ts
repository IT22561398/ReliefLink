import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '@relieflink/auth-middleware';
import { createRequestSchema, updateRequestSchema, updateRequestStatusSchema } from '@relieflink/validators';
import { RequestService } from '../services/request.service.js';
import { isOperationalError } from '@relieflink/utils';
import { RequestCategory, Urgency, RequestStatus } from '@relieflink/types';

export class RequestController {
  constructor(private requestService: RequestService) {}

  createRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
        return;
      }

      const parsed = createRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } });
        return;
      }

      const request = await this.requestService.createRequest(req.user.userId, {
        ...parsed.data,
        category: parsed.data.category as RequestCategory,
        urgency: parsed.data.urgency as Urgency
      });
      res.status(201).json({ success: true, data: request });
    } catch (error) {
      if (isOperationalError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      next(error);
    }
  };

  getRequests = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
        return;
      }

      const { status, urgency, district, category } = req.query;
      const filters: any = {
        ...(status ? { status: String(status) as any } : {}),
        ...(urgency ? { urgency: String(urgency) as any } : {}),
        ...(district ? { district: String(district) } : {}),
        ...(category ? { category: String(category) as any } : {})
      };

      // Apply role-based filtering
      switch (req.user.role) {
        case 'requester':
          // Requesters only see their own requests
          filters.requesterId = req.user.userId;
          break;
        case 'volunteer':
          // Volunteers see unmatched/pending/in_progress requests
          filters.status = ['pending', 'matched', 'assigned', 'in_progress'];
          break;
        case 'coordinator':
          // Coordinators see all requests in their district (if stored)
          // For now, show all requests - can be enhanced with district filtering
          break;
        case 'admin':
          // Admins see all requests - no filtering needed
          break;
      }

      const requests = await this.requestService.getRequests(filters);
      res.json({ success: true, data: requests });
    } catch (error) {
      if (isOperationalError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      next(error);
    }
  };

  getRequestById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const request = await this.requestService.getRequestById(req.params.id);
      res.json({ success: true, data: request });
    } catch (error) {
      if (isOperationalError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      next(error);
    }
  };

  updateRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = updateRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } });
        return;
      }

      const request = await this.requestService.updateRequest(req.params.id, {
        ...parsed.data,
        category: parsed.data.category ? (parsed.data.category as RequestCategory) : undefined,
        urgency: parsed.data.urgency ? (parsed.data.urgency as Urgency) : undefined
      });
      res.json({ success: true, data: request });
    } catch (error) {
      if (isOperationalError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      next(error);
    }
  };

  updateRequestStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
        return;
      }

      const parsed = updateRequestStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } });
        return;
      }

      const request = await this.requestService.updateRequestStatus(req.params.id, parsed.data.status as RequestStatus, req.user.userId);
      res.json({ success: true, data: request });
    } catch (error) {
      if (isOperationalError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      next(error);
    }
  };
}
