import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AuthPayload, UserPublic, Role } from '@relieflink/types';
import { config } from '../config/index.js';
import { UserRepository } from '../repositories/user.repository.js';
import { NotFoundError, ConflictError, UnauthorizedError } from '@relieflink/utils';

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async register(data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: Role;
    district: string;
    city: string;
    skills?: string[];
  }): Promise<{ token: string; user: UserPublic }> {
    // Prevent coordinator/admin self-registration
    if (data.role === 'coordinator' || data.role === 'admin') {
      throw new UnauthorizedError('Cannot self-register as coordinator or admin');
    }

    // Check if email already exists
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Determine status based on role
    const status = data.role === 'volunteer' ? 'pending' : 'active';

    // Create user
    const user = await this.userRepository.create({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: data.role,
      district: data.district,
      city: data.city,
      status
    });

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as Role
    });

    // If volunteer with skills, create volunteer record via HTTP (fire-and-forget)
    if (data.role === 'volunteer' && data.skills && data.skills.length > 0) {
      try {
        fetch(`${config.services.volunteerUrl}/api/v1/volunteers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: user.id,
            skillSet: data.skills,
            district: data.district,
            city: data.city,
            availabilityStatus: 'available'
          })
        }).catch(() => {
          // Silently fail - volunteer record can be created later during approval
        });
      } catch {
        // Ignore errors
      }
    }

    return {
      token,
      user: this.toPublicUser(user)
    };
  }

  async login(email: string, password: string): Promise<{ token: string; user: UserPublic }> {
    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if volunteer is approved
    if (user.role === 'volunteer' && user.status === 'pending') {
      throw new UnauthorizedError('Your volunteer account is pending approval. Please wait for coordinator approval.');
    }

    if (user.role === 'volunteer' && user.status === 'rejected') {
      throw new UnauthorizedError('Your volunteer account has been rejected.');
    }

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as Role
    });

    return {
      token,
      user: this.toPublicUser(user)
    };
  }

  async getMe(userId: string): Promise<UserPublic> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    return this.toPublicUser(user);
  }

  private generateToken(payload: Omit<AuthPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
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
