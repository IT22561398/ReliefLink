import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { createLogger, createRequestLogger, createErrorLogger } from '@relieflink/logger';
import { createAuthMiddleware, requireCoordinatorOrAdmin, AuthenticatedRequest } from '@relieflink/auth-middleware';
import { NotificationChannel } from '@relieflink/types';
import { config } from './config/index.js';
import { PrismaClient, VolunteerAvailability, ResourceAvailability, AssignmentStatus } from '../generated/client/index.js';
import { z } from 'zod';
import { swaggerSpec } from './swagger.js';
import { NotificationQueueClient } from './infrastructure/queue-client.js';
import { Queue } from 'bullmq';
import type { NotificationJobData } from '@relieflink/queue';

export function createApp(prisma: PrismaClient, notificationQueue: Queue<NotificationJobData>): Express {
  const app = express();
  const logger = createLogger({ service: 'volunteer-service', level: config.logLevel });
  const authMiddleware = createAuthMiddleware({ secret: config.jwt.secret });
  const notificationQueueClient = new NotificationQueueClient(notificationQueue);

  app.use(cors());
  app.use(express.json());
  app.use(createRequestLogger(logger));

  // Schemas
  const volunteerSchema = z.object({
    userId: z.string().min(1),
    skillSet: z.array(z.string()).default([]),
    district: z.string().min(2),
    city: z.string().min(2),
    availabilityStatus: z.nativeEnum(VolunteerAvailability).default(VolunteerAvailability.available)
  });

  const availabilitySchema = z.object({ availabilityStatus: z.nativeEnum(VolunteerAvailability) });

  const resourceSchema = z.object({
    ownerId: z.string().min(1),
    category: z.string().min(2),
    quantity: z.number().int().positive(),
    district: z.string().min(2),
    city: z.string().min(2),
    availabilityStatus: z.nativeEnum(ResourceAvailability).default(ResourceAvailability.available)
  });

  const assignmentSchema = z.object({
    requestId: z.string().min(1),
    volunteerId: z.string().optional(),
    resourceId: z.string().optional(),
    status: z.nativeEnum(AssignmentStatus).default(AssignmentStatus.assigned)
  });

  const assignmentStatusSchema = z.object({
    status: z.nativeEnum(AssignmentStatus)
  });

  const selfAcceptSchema = z.object({
    requestId: z.string().min(1)
  });

  // Health
  app.get('/health', (_req, res) => res.json({ service: 'volunteer-service', status: 'ok' }));

  // Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Volunteers
  app.post('/api/v1/volunteers', authMiddleware, async (req: AuthenticatedRequest, res) => {
    const parsed = volunteerSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } }); return; }
    if (req.user?.userId !== parsed.data.userId && !['coordinator', 'admin'].includes(req.user?.role ?? '')) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot register for another user' } }); return;
    }
    const existing = await prisma.volunteer.findUnique({ where: { userId: parsed.data.userId } });
    if (existing) { res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Volunteer profile already exists' } }); return; }
    const record = await prisma.volunteer.create({ data: parsed.data });
    res.status(201).json({ success: true, data: record });
  });

  app.get('/api/v1/volunteers', authMiddleware, async (_req, res) => {
    const volunteers = await prisma.volunteer.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: volunteers });
  });

  app.patch('/api/v1/volunteers/:id/availability', authMiddleware, async (req: AuthenticatedRequest, res) => {
    const parsed = availabilitySchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } }); return; }
    const volunteer = await prisma.volunteer.findUnique({ where: { id: req.params.id } });
    if (!volunteer) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Volunteer not found' } }); return; }
    if (volunteer.userId !== req.user?.userId && !['coordinator', 'admin'].includes(req.user?.role ?? '')) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } }); return;
    }
    const updated = await prisma.volunteer.update({ where: { id: req.params.id }, data: { availabilityStatus: parsed.data.availabilityStatus } });
    res.json({ success: true, data: updated });
  });

  // Resources
  app.post('/api/v1/resources', authMiddleware, async (req, res) => {
    const parsed = resourceSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } }); return; }
    const record = await prisma.resource.create({ data: parsed.data });
    res.status(201).json({ success: true, data: record });
  });

  app.get('/api/v1/resources', authMiddleware, async (req, res) => {
    const { district, category } = req.query;
    const filtered = await prisma.resource.findMany({
      where: {
        ...(district ? { district: { equals: String(district), mode: 'insensitive' as const } } : {}),
        ...(category ? { category: { equals: String(category), mode: 'insensitive' as const } } : {})
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: filtered });
  });

  // Assignments
  app.post('/api/v1/assignments', authMiddleware, requireCoordinatorOrAdmin, async (req: AuthenticatedRequest, res) => {
    const parsed = assignmentSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } }); return; }

    const requestResponse = await fetch(`${config.services.requestUrl}/api/v1/requests/${parsed.data.requestId}`, {
      headers: { Authorization: req.headers.authorization ?? '' }
    });
    if (!requestResponse.ok) { res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Referenced request does not exist' } }); return; }

    if (parsed.data.volunteerId && !(await prisma.volunteer.findUnique({ where: { id: parsed.data.volunteerId } }))) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Volunteer not found' } }); return;
    }
    if (parsed.data.resourceId && !(await prisma.resource.findUnique({ where: { id: parsed.data.resourceId } }))) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } }); return;
    }

    // Create assignment (SYNC)
    const assignment = await prisma.assignment.create({
      data: {
        requestId: parsed.data.requestId,
        volunteerId: parsed.data.volunteerId,
        resourceId: parsed.data.resourceId,
        assignedBy: req.user?.userId ?? 'system',
        status: parsed.data.status
      }
    });

    // Update request status (SYNC)
    await fetch(`${config.services.requestUrl}/api/v1/requests/${parsed.data.requestId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: req.headers.authorization ?? '' },
      body: JSON.stringify({ status: 'assigned' })
    });

    // Queue notification (ASYNC)
    if (parsed.data.volunteerId) {
      const volunteer = await prisma.volunteer.findUnique({ where: { id: parsed.data.volunteerId } });
      if (volunteer) {
        await notificationQueueClient.queueNotification({
          userId: volunteer.userId,
          message: `You were assigned to request ${parsed.data.requestId}`,
              channel: NotificationChannel.in_app
        });
      }
    }

    res.status(201).json({ success: true, data: assignment });
  });

  app.get('/api/v1/assignments/:requestId', authMiddleware, async (req, res) => {
    const records = await prisma.assignment.findMany({ where: { requestId: req.params.requestId }, orderBy: { assignedAt: 'desc' } });
    res.json({ success: true, data: records });
  });

  // VOLUNTEER SELF-ACCEPT REQUEST
  app.post('/api/v1/assignments/self-accept', authMiddleware, async (req: AuthenticatedRequest, res) => {
    const parsed = selfAcceptSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } });
      return;
    }

    try {
      // Check if volunteer profile exists for this user
      const volunteer = await prisma.volunteer.findUnique({
        where: { userId: req.user?.userId ?? '' }
      });

      if (!volunteer) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Volunteer profile not found' } });
        return;
      }

      // Check if volunteer already has an active assignment
      const activeAssignment = await prisma.assignment.findFirst({
        where: {
          volunteerId: volunteer.id,
          status: { in: ['assigned', 'in_progress'] }
        }
      });

      if (activeAssignment) {
        res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Volunteer already has an active assignment' } });
        return;
      }

      // Verify request exists
      const requestResponse = await fetch(`${config.services.requestUrl}/api/v1/requests/${parsed.data.requestId}`, {
        headers: { Authorization: req.headers.authorization ?? '' }
      });
      if (!requestResponse.ok) {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Request not found' } });
        return;
      }

      const requestData = await requestResponse.json();
      logger.info('Request data fetched', { requestId: parsed.data.requestId, requesterId: requestData.data?.requesterId });

      // Fetch volunteer user data from auth service
      let volunteerUser: { fullName?: string; phone?: string; email?: string } = {};
      try {
        const userResponse = await fetch(`${config.services.authUrl}/api/v1/users/${req.user?.userId}`, {
          headers: { Authorization: req.headers.authorization ?? '' }
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          volunteerUser = userData.data || {};
        }
      } catch (err) {
        logger.warn('Failed to fetch volunteer user data', { userId: req.user?.userId });
      }

      // Create assignment with volunteer as requester (self-assigned)
      const assignment = await prisma.assignment.create({
        data: {
          requestId: parsed.data.requestId,
          volunteerId: volunteer.id,
          assignedBy: req.user?.userId ?? 'system',
          status: 'assigned'
        }
      });
      logger.info('Assignment created', { assignmentId: assignment.id, volunteerId: volunteer.id });

      // Update request status to 'matched'
      const statusUpdateResponse = await fetch(`${config.services.requestUrl}/api/v1/requests/${parsed.data.requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: req.headers.authorization ?? '' },
        body: JSON.stringify({ status: 'matched' })
      });

      if (!statusUpdateResponse.ok) {
        logger.warn('Request status update failed', { status: statusUpdateResponse.status, requestId: parsed.data.requestId });
      }

      // Queue notification to requester with volunteer details (fire-and-forget)
      try {
        await notificationQueueClient.queueNotification({
          userId: requestData.data?.requesterId ?? '',
          message: `Volunteer ${volunteerUser.fullName} is ready to help! Contact: ${volunteerUser.phone || 'N/A'}`,
                channel: NotificationChannel.in_app,
          metadata: {
            requestId: parsed.data.requestId,
            volunteerId: volunteer.id,
            assignmentId: assignment.id,
            volunteerName: volunteerUser.fullName,
            volunteerPhone: volunteerUser.phone,
            volunteerEmail: volunteerUser.email,
            type: 'volunteer_accepted_request'
          }
        });
        logger.info('Notification queued', { assignmentId: assignment.id });
      } catch (notifError) {
        logger.error('Failed to queue notification', { error: notifError, assignmentId: assignment.id });
        // Don't fail the request just because notification failed
      }

      res.status(201).json({ success: true, data: assignment });
    } catch (error) {
      logger.error('Error in self-accept', {
        error: error instanceof Error ? error.message : JSON.stringify(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.userId
      });
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Failed to accept request' } });
    }
  });

  // GET VOLUNTEER'S CURRENT ASSIGNMENT
  app.get('/api/v1/assignments/volunteer/:volunteerId/current', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const volunteer = await prisma.volunteer.findUnique({
        where: { id: req.params.volunteerId }
      });

      if (!volunteer) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Volunteer not found' } });
        return;
      }

      const assignment = await prisma.assignment.findFirst({
        where: {
          volunteerId: req.params.volunteerId,
          status: { in: ['assigned', 'in_progress'] }
        },
        orderBy: { assignedAt: 'desc' }
      });

      res.json({ success: true, data: assignment });
    } catch (error) {
      logger.error('Error fetching volunteer assignment', { error });
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch assignment' } });
    }
  });

  // UPDATE ASSIGNMENT STATUS
  app.patch('/api/v1/assignments/:assignmentId/status', authMiddleware, async (req: AuthenticatedRequest, res) => {
    const parsed = assignmentStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } });
      return;
    }

    try {
      const assignment = await prisma.assignment.findUnique({
        where: { id: req.params.assignmentId }
      });

      if (!assignment) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } });
        return;
      }

      // Check if user is the volunteer or coordinator
      // For volunteers: fetch their volunteer record and compare IDs
      if (req.user?.role === 'volunteer') {
        const volunteer = await prisma.volunteer.findUnique({
          where: { userId: req.user?.userId ?? '' }
        });

        if (!volunteer || volunteer.id !== assignment.volunteerId) {
          res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot update this assignment' } });
          return;
        }
      } else if (!['coordinator', 'admin'].includes(req.user?.role ?? '')) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot update this assignment' } });
        return;
      }

      // Update assignment status
      const updated = await prisma.assignment.update({
        where: { id: req.params.assignmentId },
        data: { status: parsed.data.status }
      });

      // Update request status to match assignment status
      const newRequestStatus = parsed.data.status === 'in_progress' ? 'in_progress' : 'completed';
      const requestResponse = await fetch(`${config.services.requestUrl}/api/v1/requests/${assignment.requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: req.headers.authorization ?? '' },
        body: JSON.stringify({ status: newRequestStatus })
      });

      // Fetch request and volunteer details for notification
      let requesterId = '';
      let volunteerName = req.user?.userId;

      try {
        const fetchRequestResponse = await fetch(`${config.services.requestUrl}/api/v1/requests/${assignment.requestId}`, {
          headers: { Authorization: req.headers.authorization ?? '' }
        });
        if (fetchRequestResponse.ok) {
          const requestData = await fetchRequestResponse.json();
          logger.info('Fetched request data', { requestId: assignment.requestId, requestData });
          requesterId = requestData.data?.requesterId || '';
          logger.info('Extracted requester ID', { requesterId });
        } else {
          logger.warn('Failed to fetch request', { status: fetchRequestResponse.status, requestId: assignment.requestId });
        }
      } catch (err) {
        logger.warn('Failed to fetch request data', { requestId: assignment.requestId, error: err });
      }

      try {
        const userResponse = await fetch(`${config.services.authUrl}/api/v1/users/${req.user?.userId}`, {
          headers: { Authorization: req.headers.authorization ?? '' }
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          volunteerName = userData.data?.fullName || volunteerName;
          logger.info('Fetched volunteer name', { volunteerName });
        }
      } catch (err) {
        logger.warn('Failed to fetch volunteer user data', { userId: req.user?.userId });
      }

      // Queue notification to requester
      try {
        logger.info('Queueing notification', { requesterId, volunteerName, assignmentId: assignment.id });
        await notificationQueueClient.queueNotification({
          userId: requesterId,
          message: `Volunteer ${volunteerName} ${parsed.data.status === 'in_progress' ? 'started work' : 'completed the task'}`,
                channel: NotificationChannel.in_app,
          metadata: {
            requestId: assignment.requestId,
            assignmentId: assignment.id,
            volunteerId: assignment.volunteerId ?? '',
            newStatus: parsed.data.status,
            volunteerName: volunteerName,
            type: parsed.data.status === 'in_progress' ? 'volunteer_started_work' : 'work_completed'
          }
        });
        logger.info('Notification queued successfully', { requesterId, assignmentId: assignment.id });
      } catch (notifError) {
        logger.error('Failed to queue notification', { error: notifError, requesterId, assignmentId: assignment.id });
      }

      res.json({ success: true, data: updated });
    } catch (error) {
      logger.error('Error updating assignment status', { error });
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update assignment status' } });
    }
  });

  app.use(createErrorLogger(logger));
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', { error: err.message });
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
}
