import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthPayload } from '@relieflink/types';
import { AuthenticatedRequest, JwtConfig } from './types';

/**
 * Creates a JWT authentication middleware factory
 */
export function createAuthMiddleware(config: JwtConfig) {
  return function authMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Missing bearer token'
        }
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const payload = jwt.verify(token, config.secret, {
        issuer: config.issuer,
        audience: config.audience
      }) as AuthPayload;

      req.user = payload;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Token has expired'
          }
        });
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid token'
          }
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication failed'
        }
      });
    }
  };
}

/**
 * Optional auth middleware - doesn't fail if no token present
 */
export function createOptionalAuthMiddleware(config: JwtConfig) {
  return function optionalAuthMiddleware(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const payload = jwt.verify(token, config.secret, {
        issuer: config.issuer,
        audience: config.audience
      }) as AuthPayload;

      req.user = payload;
    } catch {
      // Silently ignore invalid tokens in optional auth
    }

    next();
  };
}

/**
 * Generate JWT token
 */
export function generateToken(payload: Omit<AuthPayload, 'iat' | 'exp'>, config: JwtConfig): string {
  return jwt.sign(payload, config.secret, {
    expiresIn: config.expiresIn ?? '1d',
    issuer: config.issuer,
    audience: config.audience
  } as jwt.SignOptions);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string, config: JwtConfig): AuthPayload {
  return jwt.verify(token, config.secret, {
    issuer: config.issuer,
    audience: config.audience
  }) as AuthPayload;
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): AuthPayload | null {
  return jwt.decode(token) as AuthPayload | null;
}
