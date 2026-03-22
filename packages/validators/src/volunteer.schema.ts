import { z } from 'zod';
import { districtSchema, citySchema, uuidSchema } from './common.schema';

/**
 * Volunteer availability enum
 */
export const VolunteerAvailabilityEnum = z.enum(['available', 'busy', 'offline']);

/**
 * Resource availability enum
 */
export const ResourceAvailabilityEnum = z.enum(['available', 'reserved', 'unavailable']);

/**
 * Assignment status enum
 */
export const AssignmentStatusEnum = z.enum(['assigned', 'in_progress', 'completed']);

/**
 * Create volunteer schema
 */
export const createVolunteerSchema = z.object({
  skillSet: z.array(z.string().min(1)).min(1, 'At least one skill is required'),
  district: districtSchema,
  city: citySchema
});

/**
 * Update volunteer availability schema
 */
export const updateVolunteerAvailabilitySchema = z.object({
  availabilityStatus: VolunteerAvailabilityEnum
});

/**
 * Create resource schema
 */
export const createResourceSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  district: districtSchema,
  city: citySchema
});

/**
 * Update resource schema
 */
export const updateResourceSchema = z.object({
  quantity: z.number().int().positive().optional(),
  availabilityStatus: ResourceAvailabilityEnum.optional()
});

/**
 * Create assignment schema
 */
export const createAssignmentSchema = z.object({
  requestId: uuidSchema,
  volunteerId: uuidSchema.optional(),
  resourceId: uuidSchema.optional()
}).refine(
  (data) => data.volunteerId || data.resourceId,
  { message: 'Either volunteerId or resourceId must be provided' }
);

/**
 * Update assignment status schema
 */
export const updateAssignmentStatusSchema = z.object({
  status: AssignmentStatusEnum
});

/**
 * Volunteer filters schema
 */
export const volunteerFiltersSchema = z.object({
  availabilityStatus: VolunteerAvailabilityEnum.optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  skill: z.string().optional()
});

// Type exports
export type CreateVolunteerInput = z.infer<typeof createVolunteerSchema>;
export type UpdateVolunteerAvailabilityInput = z.infer<typeof updateVolunteerAvailabilitySchema>;
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentStatusInput = z.infer<typeof updateAssignmentStatusSchema>;
export type VolunteerFilters = z.infer<typeof volunteerFiltersSchema>;
