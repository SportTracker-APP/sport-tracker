import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service';

import { BCRYPT_COST } from '../auth/auth-security.constants';
import { buildDefaultGoals } from '../goals/default-goals';

import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserPasswordDto } from './dto/update-admin-user-password.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics() {
    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      stravaConnections,
      syncedActivities,
      newUsersLast7Days,
      latestSyncedActivity,
    ] = await Promise.all([
      this.prisma.user.count(),

      this.prisma.stravaConnection.count(),

      this.prisma.activity.count({
        where: {
          stravaActivityId: {
            not: null,
          },
        },
      }),

      this.prisma.user.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),

      this.prisma.activity.findFirst({
        where: {
          stravaActivityId: {
            not: null,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          createdAt: true,
          title: true,
          user: {
            select: {
              firstName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      totalUsers,
      stravaConnections,
      syncedActivities,
      newUsersLast7Days,
      lastSynchronizationAt: latestSyncedActivity?.createdAt ?? null,
      lastSynchronizationActivityTitle: latestSyncedActivity?.title ?? null,
      lastSynchronizationUser: latestSyncedActivity?.user ?? null,
    };
  }

  async getUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        stravaConnection: {
          select: {
            id: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            activities: true,
          },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
      hasStrava: Boolean(user.stravaConnection),
      stravaUpdatedAt: user.stravaConnection?.updatedAt ?? null,
      activitiesCount: user._count.activities,
    }));
  }

  async createUser(dto: CreateAdminUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_COST);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPassword,
        role: dto.role ?? UserRole.USER,
        goals: {
          create: buildDefaultGoals(),
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isBlocked: true,
        createdAt: true,
      },
    });

    return {
      ...user,
      hasStrava: false,
      stravaUpdatedAt: null,
      activitiesCount: 0,
    };
  }

  async updateUser(
    adminUserId: string,
    userId: string,
    dto: UpdateAdminUserDto,
  ) {
    if (adminUserId === userId && dto.isBlocked) {
      throw new ForbiddenException('Impossible de bloquer votre propre compte');
    }

    if (adminUserId === userId && dto.role && dto.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Impossible de retirer votre propre rôle admin',
      );
    }

    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role: dto.role,
        isBlocked: dto.isBlocked,
        refreshToken: dto.isBlocked ? null : undefined,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        stravaConnection: {
          select: {
            id: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            activities: true,
          },
        },
      },
    });

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
      hasStrava: Boolean(user.stravaConnection),
      stravaUpdatedAt: user.stravaConnection?.updatedAt ?? null,
      activitiesCount: user._count.activities,
    };
  }

  async updateUserPassword(userId: string, dto: UpdateAdminUserPasswordDto) {
    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_COST);

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword,
        refreshToken: null,
      },
    });

    return {
      success: true,
    };
  }

  async deleteUser(adminUserId: string, userId: string) {
    if (adminUserId === userId) {
      throw new ForbiddenException(
        'Impossible de supprimer votre propre compte',
      );
    }

    await this.prisma.user.deleteMany({
      where: {
        id: userId,
      },
    });

    return {
      success: true,
    };
  }
}
