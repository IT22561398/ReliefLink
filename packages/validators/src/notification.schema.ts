import { z } from 'zod';
import { uuidSchema } from './common.schema';

/**
 * Notification channel enum
 */
export const NotificationChannelEnum = z.enum(['in_app', 'email', 'sms', 'push']);

/**
 * Delivery status enum
 */
export const DeliveryStatusEnum = z.enum(['queued', 'delivered', 'failed']);

/**
 * Create notification schema
 */
export const createNotificationSchema = z.object({
  userId: uuidSchema,
  message: z.string().min(3, 'Message must be at least 3 characters'),
  channel: NotificationChannelEnum.default('in_app')
});

/**
 * Create status event schema
 */
export const createStatusEventSchema = z.object({
  requestId: uuidSchema,
  oldStatus: z.string().min(1, 'Old status is required'),
  newStatus: z.string().min(1, 'New status is required'),
  changedBy: uuidSchema
});

/**
 * Notification query filters
 */
export const notificationFiltersSchema = z.object({
  channel: NotificationChannelEnum.optional(),
  deliveryStatus: DeliveryStatusEnum.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

/**
 * User ID param schema
 */
export const userIdParamSchema = z.object({
  userId: uuidSchema
});

/**
 * Status event request ID param schema
 */
export const statusEventRequestIdParamSchema = z.object({
  requestId: uuidSchema
});

// Type exports
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type CreateStatusEventInput = z.infer<typeof createStatusEventSchema>;
export type NotificationFilters = z.infer<typeof notificationFiltersSchema>;
