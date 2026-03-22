import type { RequestCategory, Urgency, RequestStatus } from '@relieflink/types';
import { RequestRepository, RequestFilters } from '../repositories/request.repository.js';
import { NotificationQueueClient } from '../infrastructure/queue-client.js';
import { NotFoundError } from '@relieflink/utils';
import { ReliefRequest } from '../../generated/client/index.js';

export class RequestService {
  constructor(
    private requestRepository: RequestRepository,
    private notificationQueueClient: NotificationQueueClient
  ) {}

  async createRequest(
    requesterId: string,
    data: {
      category: RequestCategory;
      description: string;
      urgency: Urgency;
      district: string;
      city: string;
      peopleCount: number;
    }
  ): Promise<ReliefRequest> {
    // STEP 1: Create request (SYNCHRONOUS - critical)
    const request = await this.requestRepository.create({
      requesterId,
      category: data.category as any,
      description: data.description,
      urgency: data.urgency as any,
      district: data.district,
      city: data.city,
      peopleCount: data.peopleCount
    });

    // STEP 2: Queue notification (ASYNCHRONOUS - fire-and-forget)
    await this.notificationQueueClient.queueNotification({
      userId: requesterId,
      message: `Relief request created with status ${request.status}`,
      channel: 'in_app',
      metadata: {
        requestId: request.id,
        status: request.status,
        type: 'request_created'
      }
    });

    // Return immediately - notification will process in background
    return request;
  }

  async getRequests(filters: RequestFilters = {}): Promise<ReliefRequest[]> {
    return this.requestRepository.findMany(filters);
  }

  async getRequestById(id: string): Promise<ReliefRequest> {
    const request = await this.requestRepository.findById(id);
    if (!request) {
      throw new NotFoundError('Request', id);
    }
    return request;
  }

  async updateRequest(
    id: string,
    data: Partial<{
      category: RequestCategory;
      description: string;
      urgency: Urgency;
      district: string;
      city: string;
      peopleCount: number;
    }>
  ): Promise<ReliefRequest> {
    const existing = await this.requestRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Request', id);
    }

    return this.requestRepository.update(id, data as any);
  }

  async updateRequestStatus(
    id: string,
    status: RequestStatus,
    changedBy: string
  ): Promise<ReliefRequest> {
    const existing = await this.requestRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Request', id);
    }

    const oldStatus = existing.status;
    const updated = await this.requestRepository.updateStatus(id, status as any);

    // Queue notification (ASYNCHRONOUS - fire-and-forget)
    await this.notificationQueueClient.queueNotification({
      userId: existing.requesterId,
      message: `Request ${id} status changed from ${oldStatus} to ${status}`,
      channel: 'in_app',
      metadata: {
        requestId: id,
        oldStatus: String(oldStatus),
        newStatus: String(status),
        changedBy,
        type: 'request_status_changed'
      }
    });

    return updated;
  }
}
