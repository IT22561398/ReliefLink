import { Router } from 'express';
import type { AuthenticatedRequest } from '@relieflink/auth-middleware';
import { createAuthMiddleware, requireCoordinatorOrAdmin } from '@relieflink/auth-middleware';
import { UserController } from '../controllers/user.controller.js';
import { config } from '../config/index.js';

export function createUserRoutes(userController: UserController): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware({ secret: config.jwt.secret });

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * @swagger
   * /users/volunteers/pending:
   *   get:
   *     summary: Get pending volunteers (coordinator/admin only)
   *     tags: [Users]
   *     responses:
   *       200:
   *         description: List of pending volunteers
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/User'
   *       403:
   *         description: Insufficient permissions
   */
  router.get('/volunteers/pending', requireCoordinatorOrAdmin, (req, res, next) => {
    userController.getPendingVolunteers(req as AuthenticatedRequest, res, next);
  });

  router.get('/volunteers/approved', requireCoordinatorOrAdmin, (req, res, next) => {
    userController.getApprovedVolunteers(req as AuthenticatedRequest, res, next);
  });

  router.get('/volunteers/debug/all-statuses', requireCoordinatorOrAdmin, (req, res, next) => {
    userController.getAllVolunteerStatuses(req as AuthenticatedRequest, res, next);
  });

  /**
   * @swagger
   * /users/volunteers/{id}/approve:
   *   patch:
   *     summary: Approve a pending volunteer (coordinator/admin only)
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Volunteer approved
   *       403:
   *         description: Insufficient permissions
   *       404:
   *         description: Volunteer not found
   */
  router.patch('/volunteers/:id/approve', requireCoordinatorOrAdmin, (req, res, next) => {
    userController.approveVolunteer(req as AuthenticatedRequest, res, next);
  });

  /**
   * @swagger
   * /users/volunteers/{id}/reject:
   *   patch:
   *     summary: Reject a pending volunteer (coordinator/admin only)
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Volunteer rejected
   *       403:
   *         description: Insufficient permissions
   *       404:
   *         description: Volunteer not found
   */
  router.patch('/volunteers/:id/reject', requireCoordinatorOrAdmin, (req, res, next) => {
    userController.rejectVolunteer(req as AuthenticatedRequest, res, next);
  });

  /**
   * @swagger
   * /users/{id}:
   *   get:
   *     summary: Get user by ID
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: User information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/:id', (req, res, next) => {
    userController.getUserById(req as AuthenticatedRequest, res, next);
  });

  /**
   * @swagger
   * /users/{id}/role:
   *   patch:
   *     summary: Update user role (coordinator/admin only)
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               role:
   *                 type: string
   *                 enum: [requester, volunteer, coordinator, admin]
   *     responses:
   *       200:
   *         description: Role updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       403:
   *         description: Insufficient permissions
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.patch('/:id/role', requireCoordinatorOrAdmin, (req, res, next) => {
    userController.updateUserRole(req as AuthenticatedRequest, res, next);
  });

  return router;
}

