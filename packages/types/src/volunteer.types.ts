import { VolunteerAvailability, ResourceAvailability, AssignmentStatus } from './enums';

/**
 * Volunteer interface
 */
export interface Volunteer {
  id: string;
  userId: string;
  skillSet: string[];
  district: string;
  city: string;
  availabilityStatus: VolunteerAvailability;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create volunteer input
 */
export interface CreateVolunteerInput {
  userId: string;
  skillSet: string[];
  district: string;
  city: string;
}

/**
 * Update volunteer availability input
 */
export interface UpdateVolunteerAvailabilityInput {
  availabilityStatus: VolunteerAvailability;
}

/**
 * Resource interface
 */
export interface Resource {
  id: string;
  ownerId: string;
  category: string;
  quantity: number;
  district: string;
  city: string;
  availabilityStatus: ResourceAvailability;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create resource input
 */
export interface CreateResourceInput {
  ownerId: string;
  category: string;
  quantity: number;
  district: string;
  city: string;
}

/**
 * Assignment interface
 */
export interface Assignment {
  id: string;
  requestId: string;
  volunteerId?: string;
  resourceId?: string;
  assignedBy: string;
  status: AssignmentStatus;
  assignedAt: Date;
}

/**
 * Create assignment input
 */
export interface CreateAssignmentInput {
  requestId: string;
  volunteerId?: string;
  resourceId?: string;
}

/**
 * Volunteer query filters
 */
export interface VolunteerFilters {
  availabilityStatus?: VolunteerAvailability;
  district?: string;
  city?: string;
  skill?: string;
}
