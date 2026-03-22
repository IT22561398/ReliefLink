import { z } from 'zod';

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Password validation schema (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Simple password for login (just min length)
 */
export const loginPasswordSchema = z.string().min(1, 'Password is required');

/**
 * Phone number validation
 */
export const phoneSchema = z
  .string()
  .min(8, 'Phone number must be at least 8 characters')
  .regex(/^[+]?[\d\s-]+$/, 'Invalid phone number format');

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('Invalid ID format');

/**
 * Pagination query schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * District validation
 */
export const districtSchema = z.string().min(2, 'District must be at least 2 characters');

/**
 * City validation
 */
export const citySchema = z.string().min(2, 'City must be at least 2 characters');

/**
 * Full name validation
 */
export const fullNameSchema = z.string().min(2, 'Full name must be at least 2 characters');
