import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  loginPasswordSchema,
  phoneSchema,
  fullNameSchema,
  districtSchema,
  citySchema
} from './common.schema';

/**
 * Role enum for validation
 */
export const RoleEnum = z.enum(['requester', 'volunteer', 'coordinator', 'admin']);

/**
 * Registration request schema
 */
export const registerSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  role: RoleEnum.default('requester'),
  district: districtSchema,
  city: citySchema,
  skills: z.array(z.string()).optional()
});

/**
 * Login request schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema
});

/**
 * Role update schema
 */
export const roleUpdateSchema = z.object({
  role: RoleEnum
});

/**
 * User update schema
 */
export const userUpdateSchema = z.object({
  fullName: fullNameSchema.optional(),
  phone: phoneSchema.optional(),
  district: districtSchema.optional(),
  city: citySchema.optional()
});

/**
 * Refresh token schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
