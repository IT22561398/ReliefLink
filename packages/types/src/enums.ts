/**
 * User roles for access control
 */
export enum Role {
  requester = 'requester',
  volunteer = 'volunteer',
  coordinator = 'coordinator',
  admin = 'admin'
}

/**
 * Categories for relief requests
 */
export enum RequestCategory {
  water = 'water',
  food = 'food',
  medicine = 'medicine',
  shelter = 'shelter',
  rescue = 'rescue',
  transport = 'transport',
  other = 'other'
}

/**
 * Urgency levels for relief requests
 */
export enum Urgency {
  low = 'low',
  medium = 'medium',
  high = 'high'
}

/**
 * Status of a relief request
 */
export enum RequestStatus {
  pending = 'pending',
  matched = 'matched',
  assigned = 'assigned',
  in_progress = 'in_progress',
  completed = 'completed',
  cancelled = 'cancelled'
}

/**
 * Volunteer availability status
 */
export enum VolunteerAvailability {
  available = 'available',
  busy = 'busy',
  offline = 'offline'
}

/**
 * Resource availability status
 */
export enum ResourceAvailability {
  available = 'available',
  reserved = 'reserved',
  unavailable = 'unavailable'
}

/**
 * Assignment status
 */
export enum AssignmentStatus {
  assigned = 'assigned',
  in_progress = 'in_progress',
  completed = 'completed'
}

/**
 * Notification delivery channels
 */
export enum NotificationChannel {
  in_app = 'in_app',
  email = 'email',
  sms = 'sms',
  push = 'push'
}

/**
 * Notification delivery status
 */
export enum DeliveryStatus {
  queued = 'queued',
  delivered = 'delivered',
  failed = 'failed'
}
