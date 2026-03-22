import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '@relieflink/auth-middleware';
import { registerSchema, loginSchema } from '@relieflink/validators';
import { AuthService } from '../services/auth.service.js';
import { Role } from '@relieflink/types';
import { isOperationalError } from '@relieflink/utils';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() }
        });
        return;
      }

      const result = await this.authService.register({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        password: parsed.data.password,
        role: parsed.data.role as Role,
        district: parsed.data.district,
        city: parsed.data.city,
        skills: parsed.data.skills
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      if (isOperationalError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() }
        });
        return;
      }

      const result = await this.authService.login(parsed.data.email, parsed.data.password);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      if (isOperationalError(error)) {
        res.status(error.statusCode).json(error.toJSON());
        return;
      }
      next(error);
    }
  };

  getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
        });
        return;
      }

      const user = await this.authService.getMe(req.user.userId);

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
}
