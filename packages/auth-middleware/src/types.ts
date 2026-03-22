import { Request } from 'express';
import { Role, AuthPayload } from '@relieflink/types';

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

/**
 * JWT configuration options
 */
export interface JwtConfig {
  secret: string;
  expiresIn?: string;
  issuer?: string;
  audience?: string;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
}

/**
 * RBAC permission check function
 */
export type PermissionCheck = (user: AuthPayload, resource?: unknown) => boolean;

/**
 * Role hierarchy for RBAC
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.requester]: 1,
  [Role.volunteer]: 2,
  [Role.coordinator]: 3,
  [Role.admin]: 4
};

/**
 * Check if a role has minimum required level
 */
export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
