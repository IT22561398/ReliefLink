import { Response, NextFunction } from 'express';
import { Role } from '@relieflink/types';
import { AuthenticatedRequest, hasMinimumRole, PermissionCheck } from './types';

const ROLE_VOLUNTEER = 'volunteer' as Role;
const ROLE_COORDINATOR = 'coordinator' as Role;
const ROLE_ADMIN = 'admin' as Role;

/**
 * Require specific roles middleware factory
 */
export function requireRoles(...allowedRoles: Role[]) {
  return function rolesMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource'
        }
      });
      return;
    }

    next();
  };
}

/**
 * Require minimum role level middleware factory
 */
export function requireMinRole(minRole: Role) {
  return function minRoleMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!hasMinimumRole(req.user.role, minRole)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: `Requires at least ${minRole} role`
        }
      });
      return;
    }

    next();
  };
}

/**
 * Common role shortcuts
 */
export const requireAdmin = requireRoles(ROLE_ADMIN);
export const requireCoordinator = requireRoles(ROLE_COORDINATOR, ROLE_ADMIN);
export const requireVolunteer = requireRoles(ROLE_VOLUNTEER, ROLE_COORDINATOR, ROLE_ADMIN);

/**
 * Require coordinator or admin role
 */
export function requireCoordinatorOrAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'NOT_AUTHENTICATED',
        message: 'Authentication required'
      }
    });
    return;
  }

  if (req.user.role !== ROLE_COORDINATOR && req.user.role !== ROLE_ADMIN) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Requires coordinator or admin role'
      }
    });
    return;
  }

  next();
}

/**
 * Resource owner check middleware factory
 * Checks if the authenticated user owns the resource
 */
export function requireOwnerOrRole(
  getOwnerId: (req: AuthenticatedRequest) => string | Promise<string>,
  ...allowedRoles: Role[]
) {
  return async function ownerOrRoleMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required'
        }
      });
      return;
    }

    // Check if user has allowed role
    if (allowedRoles.length > 0 && allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    // Check if user is the owner
    try {
      const ownerId = await getOwnerId(req);
      if (ownerId === req.user.userId) {
        next();
        return;
      }
    } catch {
      // Owner check failed
    }

    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource'
      }
    });
  };
}

/**
 * Custom permission check middleware factory
 */
export function requirePermission(check: PermissionCheck, resource?: unknown) {
  return function permissionMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!check(req.user, resource)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Permission denied'
        }
      });
      return;
    }

    next();
  };
}
