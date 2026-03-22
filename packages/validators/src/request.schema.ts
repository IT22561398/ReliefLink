import { z } from 'zod';
import { districtSchema, citySchema, uuidSchema } from './common.schema';

/**
 * Request category enum
 */
export const RequestCategoryEnum = z.enum([
  'water',
  'food',
  'medicine',
  'shelter',
  'rescue',
  'transport',
  'other'
]);

/**
 * Urgency enum
 */
export const UrgencyEnum = z.enum(['low', 'medium', 'high']);

/**
 * Request status enum
 */
export const RequestStatusEnum = z.enum([
  'pending',
  'matched',
  'assigned',
  'in_progress',
  'completed',
  'cancelled'
]);

/**
 * Create relief request schema
 */
export const createRequestSchema = z.object({
  category: RequestCategoryEnum,
  description: z.string().min(5, 'Description must be at least 5 characters'),
  urgency: UrgencyEnum,
  district: districtSchema,
  city: citySchema,
  peopleCount: z.number().int().positive('People count must be a positive integer')
});

/**
 * Update relief request schema
 */
export const updateRequestSchema = z.object({
  category: RequestCategoryEnum.optional(),
  description: z.string().min(5).optional(),
  urgency: UrgencyEnum.optional(),
  district: districtSchema.optional(),
  city: citySchema.optional(),
  peopleCount: z.number().int().positive().optional()
});

/**
 * Update request status schema
 */
export const updateRequestStatusSchema = z.object({
  status: RequestStatusEnum
});

/**
 * Request filters schema
 */
export const requestFiltersSchema = z.object({
  status: RequestStatusEnum.optional(),
  category: RequestCategoryEnum.optional(),
  urgency: UrgencyEnum.optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  requesterId: uuidSchema.optional()
});

/**
 * Request ID param schema
 */
export const requestIdParamSchema = z.object({
  id: uuidSchema
});

// Type exports
export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>;
export type RequestFilters = z.infer<typeof requestFiltersSchema>;
