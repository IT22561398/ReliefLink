import { PrismaClient } from '../../generated/client/index.js';
import { AssignmentStatus } from '../../generated/client/index.js';
import { NotificationChannel } from '@relieflink/types';
import { NotificationQueueClient } from '../infrastructure/queue-client.js';
import { createLogger } from '@relieflink/logger';

const logger = createLogger({ service: 'volunteer-service' });

export class AssignmentService {
  constructor(
    private prisma: PrismaClient,
    private notificationQueueClient: NotificationQueueClient
  ) {}

  async createAssignment(
    requestId: string,
    volunteerId: string | undefined,
    resourceId: string | undefined,
    assignedBy: string,
    status: AssignmentStatus
  ) {
    // STEP 1: Create assignment in database (SYNCHRONOUS - critical)
    const assignment = await this.prisma.assignment.create({
      data: {
        requestId,
        volunteerId,
        resourceId,
        assignedBy,
        status
      }
    });

    // STEP 2: Queue notification if volunteer assigned (ASYNCHRONOUS - fire-and-forget)
    if (volunteerId) {
      const volunteer = await this.prisma.volunteer.findUnique({
        where: { id: volunteerId }
      });

      if (volunteer) {
        await this.notificationQueueClient.queueNotification({
          userId: volunteer.userId,
          message: `You have been assigned to relief request ${requestId}. Status: ${status}`,
          channel: NotificationChannel.in_app,
          metadata: {
            requestId,
            volunteerId,
            assignmentId: assignment.id,
            assignmentStatus: status,
            type: 'volunteer_assigned'
          }
        });
      }
    }

    logger.info('Assignment created', {
      assignmentId: assignment.id,
      requestId,
      volunteerId,
      resourceId
    });

    return assignment;
  }

  async getAssignments(requestId: string) {
    return this.prisma.assignment.findMany({
      where: { requestId },
      orderBy: { assignedAt: 'desc' }
    });
  }
}
