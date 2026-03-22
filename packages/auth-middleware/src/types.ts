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
  requester: 1,
  volunteer: 2,
  coordinator: 3,
  admin: 4
};

/**
 * Check if a role has minimum required level
 */
export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY] ?? Number.MAX_SAFE_INTEGER;
  return userLevel >= requiredLevel;
}
