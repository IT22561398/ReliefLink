import type { Role, UserPublic } from '@relieflink/types';
import { Role as RoleEnum } from '@relieflink/types';
import { UserRepository } from '../repositories/user.repository.js';
import { NotFoundError, ForbiddenError } from '@relieflink/utils';
import { config } from '../config/index.js';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getUserById(
    requesterId: string,
    requesterRole: Role,
    targetUserId: string
  ): Promise<UserPublic> {
    // Check authorization: users can only view their own profile unless they're admin/coordinator
    if (
      requesterId !== targetUserId &&
      requesterRole !== 'admin' &&
      requesterRole !== 'coordinator'
    ) {
      throw new ForbiddenError('You can only view your own profile');
    }

    const user = await this.userRepository.findById(targetUserId);
    if (!user) {
      throw new NotFoundError('User', targetUserId);
    }

    return this.toPublicUser(user);
  }

  async updateUserRole(
    targetUserId: string,
    newRole: Role
  ): Promise<{ userId: string; role: Role }> {
    const existing = await this.userRepository.findById(targetUserId);
    if (!existing) {
      throw new NotFoundError('User', targetUserId);
    }

    const updated = await this.userRepository.updateRole(targetUserId, newRole);

    return {
      userId: updated.id,
      role: updated.role as Role
    };
  }

  async getPendingVolunteers(): Promise<UserPublic[]> {
    const users = await this.userRepository.findByRoleAndStatus(RoleEnum.volunteer, 'pending');
    return users.map(user => this.toPublicUser(user));
  }

  async getApprovedVolunteers(): Promise<UserPublic[]> {
    const users = await this.userRepository.findByRoleAndStatus(RoleEnum.volunteer, 'active');
    return users.map(user => this.toPublicUser(user));
  }

  async approveVolunteer(volunteerId: string, token: string): Promise<{ userId: string; status: string }> {
    const user = await this.userRepository.findById(volunteerId);
    if (!user) {
      throw new NotFoundError('User', volunteerId);
    }

    if (user.role !== 'volunteer') {
      throw new ForbiddenError('Only volunteers can be approved');
    }

    const updated = await this.userRepository.updateStatus(volunteerId, 'active');

    // Create volunteer profile in volunteer-service (fire-and-forget)
    try {
      fetch(`${config.services.volunteerUrl}/api/v1/volunteers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          userId: user.id,
          skillSet: [], // Will be updated by volunteer later if needed
          district: user.district,
          city: user.city,
          availabilityStatus: 'available'
        })
      }).catch(() => {
        // Silently fail - volunteer can update profile later
      });
    } catch {
      // Ignore errors - volunteer profile creation is optional
    }

    return {
      userId: updated.id,
      status: updated.status || 'active'
    };
  }

  async rejectVolunteer(volunteerId: string): Promise<{ userId: string; status: string }> {
    const user = await this.userRepository.findById(volunteerId);
    if (!user) {
      throw new NotFoundError('User', volunteerId);
    }

    if (user.role !== 'volunteer') {
      throw new ForbiddenError('Only volunteers can be rejected');
    }

    const updated = await this.userRepository.updateStatus(volunteerId, 'rejected');

    return {
      userId: updated.id,
      status: updated.status || 'rejected'
    };
  }

  private toPublicUser(user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    status: string | null;
    district: string;
    city: string;
  }): UserPublic {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role as Role,
      status: user.status || 'active',
      district: user.district,
      city: user.city
    };
  }
}
