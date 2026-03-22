import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '@relieflink/auth-middleware';
import { roleUpdateSchema } from '@relieflink/validators';
import { UserService } from '../services/user.service.js';
import { Role } from '@relieflink/types';
import { isOperationalError } from '@relieflink/utils';

export class UserController {
  constructor(private userService: UserService) {}

  getUserById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
        });
        return;
      }

      const user = await this.userService.getUserById(
        req.user.userId,
        req.user.role,
        req.params.id
      );

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      if (isOperationalError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      next(error);
    }
  };

  updateUserRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = roleUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() }
        });
        return;
      }

      const result = await this.userService.updateUserRole(
        req.params.id,
        parsed.data.role as Role
      );

      res.json({
        success: true,
        data: { message: 'Role updated', ...result }
      });
    } catch (error) {
      if (isOperationalError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      next(error);
    }
  };

  getPendingVolunteers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const volunteers = await this.userService.getPendingVolunteers();

      res.json({
        success: true,
        data: volunteers
      });
    } catch (error) {
      if (isOperationalError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      next(error);
    }
  };

  getApprovedVolunteers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const volunteers = await this.userService.getApprovedVolunteers();

      res.json({
        success: true,
        data: volunteers
      });
    } catch (error) {
      if (isOperationalError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      next(error);
    }
  };

  approveVolunteer = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization ?? '';
      const result = await this.userService.approveVolunteer(req.params.id, authHeader);

      res.json({
        success: true,
        data: { message: 'Volunteer approved', ...result }
      });
    } catch (error) {
      if (isOperationalError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      next(error);
    }
  };

  rejectVolunteer = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.userService.rejectVolunteer(req.params.id);

      res.json({
        success: true,
        data: { message: 'Volunteer rejected', ...result }
      });
    } catch (error) {
      if (isOperationalError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      next(error);
    }
  };
}
