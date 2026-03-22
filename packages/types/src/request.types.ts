import { RequestCategory, Urgency, RequestStatus } from './enums';

/**
 * Relief request interface
 */
export interface ReliefRequest {
  id: string;
  requesterId: string;
  category: RequestCategory;
  description: string;
  urgency: Urgency;
  district: string;
  city: string;
  peopleCount: number;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create relief request input
 */
export interface CreateReliefRequestInput {
  category: RequestCategory;
  description: string;
  urgency: Urgency;
  district: string;
  city: string;
  peopleCount: number;
}

/**
 * Update relief request input
 */
export interface UpdateReliefRequestInput {
  category?: RequestCategory;
  description?: string;
  urgency?: Urgency;
  district?: string;
  city?: string;
  peopleCount?: number;
}

/**
 * Update request status input
 */
export interface UpdateRequestStatusInput {
  status: RequestStatus;
}

/**
 * Request query filters
 */
export interface RequestFilters {
  status?: RequestStatus;
  category?: RequestCategory;
  urgency?: Urgency;
  district?: string;
  city?: string;
  requesterId?: string;
}
