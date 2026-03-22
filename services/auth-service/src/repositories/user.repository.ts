import { PrismaClient, User } from '../../generated/client/index.js';
import type { Role } from '@relieflink/types';

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async create(data: {
    fullName: string;
    email: string;
    phone: string;
    passwordHash: string;
    role: Role;
    district: string;
    city: string;
    status?: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
        status: data.status || 'active'
      }
    });
  }

  async updateRole(id: string, role: Role): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { role }
    });
  }

  async findByRole(role: Role): Promise<User[]> {
    return this.prisma.user.findMany({ where: { role } });
  }

  async findByStatus(status: string): Promise<User[]> {
    return this.prisma.user.findMany({ where: { status } });
  }

  async findByRoleAndStatus(role: Role, status: string): Promise<User[]> {
    // For pending status, include records with explicit 'pending' status OR NULL status (backward compat)
    if (status === 'pending') {
      return this.prisma.user.findMany({
        where: {
          role,
          OR: [
            { status: 'pending' },
            { status: null }
          ]
        }
      });
    }

    return this.prisma.user.findMany({ where: { role, status } });
  }

  async updateStatus(id: string, status: string): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { status } });
  }

  async upsert(email: string, data: {
    fullName: string;
    phone: string;
    passwordHash: string;
    role: Role;
    district: string;
    city: string;
  }): Promise<User> {
    return this.prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: {},
      create: {
        ...data,
        email: email.toLowerCase()
      }
    });
  }
}
