import { Role } from './enums';

/**
 * Base user interface
 */
export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  district: string;
  city: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User without sensitive fields (for API responses)
 */
export interface UserPublic {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status?: string;
  district: string;
  city: string;
}

/**
 * JWT payload structure
 */
export interface AuthPayload {
  userId: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

/**
 * Login request body
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Registration request body
 */
export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role?: Role;
  district: string;
  city: string;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: UserPublic;
}

/**
 * Token refresh request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}
