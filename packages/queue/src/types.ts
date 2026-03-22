import { NotificationChannel } from '@relieflink/types';

/**
 * Notification job data
 */
export interface NotificationJobData {
  userId: string;
  message: string;
  channel: NotificationChannel;
  metadata?: Record<string, unknown>;
}

/**
 * Email job data
 */
export interface EmailJobData {
  to: string;
  subject: string;
  body?: string;
  html?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
}

/**
 * SMS job data
 */
export interface SmsJobData {
  to: string;
  message: string;
}

/**
 * Audit log job data
 */
export interface AuditJobData {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Request matching job data
 */
export interface MatchingJobData {
  requestId: string;
  district: string;
  city: string;
  category: string;
  urgency: string;
}
