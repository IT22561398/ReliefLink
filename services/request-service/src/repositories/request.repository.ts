import { PrismaClient, ReliefRequest, RequestStatus, RequestCategory, Urgency } from '../../generated/client/index.js';

export interface RequestFilters {
  status?: RequestStatus | RequestStatus[];
  urgency?: Urgency;
  category?: RequestCategory;
  district?: string;
  requesterId?: string;
}

export class RequestRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<ReliefRequest | null> {
    return this.prisma.reliefRequest.findUnique({ where: { id } });
  }

  async findMany(filters: RequestFilters = {}): Promise<ReliefRequest[]> {
    return this.prisma.reliefRequest.findMany({
      where: {
        ...(filters.status ? (
          Array.isArray(filters.status)
            ? { status: { in: filters.status } }
            : { status: filters.status }
        ) : {}),
        ...(filters.urgency ? { urgency: filters.urgency } : {}),
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.district ? { district: { equals: filters.district, mode: 'insensitive' } } : {}),
        ...(filters.requesterId ? { requesterId: filters.requesterId } : {})
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(data: {
    requesterId: string;
    category: RequestCategory;
    description: string;
    urgency: Urgency;
    district: string;
    city: string;
    peopleCount: number;
  }): Promise<ReliefRequest> {
    return this.prisma.reliefRequest.create({
      data: {
        ...data,
        status: RequestStatus.pending
      }
    });
  }

  async update(id: string, data: Partial<{
    category: RequestCategory;
    description: string;
    urgency: Urgency;
    district: string;
    city: string;
    peopleCount: number;
  }>): Promise<ReliefRequest> {
    return this.prisma.reliefRequest.update({
      where: { id },
      data
    });
  }

  async updateStatus(id: string, status: RequestStatus): Promise<ReliefRequest> {
    return this.prisma.reliefRequest.update({
      where: { id },
      data: { status }
    });
  }
}
