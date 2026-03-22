import { NotificationChannel, DeliveryStatus } from './enums';

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  userId: string;
  message: string;
  channel: NotificationChannel;
  deliveryStatus: DeliveryStatus;
  createdAt: Date;
}

/**
 * Create notification input
 */
export interface CreateNotificationInput {
  userId: string;
  message: string;
  channel?: NotificationChannel;
}

/**
 * Status event for audit trail
 */
export interface StatusEvent {
  id: string;
  requestId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  timestamp: Date;
}

/**
 * Create status event input
 */
export interface CreateStatusEventInput {
  requestId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
}

/**
 * Notification job payload for queue
 */
export interface NotificationJobPayload {
  userId: string;
  message: string;
  channel: NotificationChannel;
  metadata?: Record<string, unknown>;
}

/**
 * Email notification payload
 */
export interface EmailNotificationPayload {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
}
