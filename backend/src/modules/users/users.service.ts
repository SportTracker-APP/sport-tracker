import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { GeoAreaType, UserGeoAreaPreferenceType } from '@prisma/client';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service';
import { BCRYPT_COST } from '../auth/auth-security.constants';

import { UpdateProfileDto } from './dto/update-profile.dto';

import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateDiscoveryGeoPreferencesDto } from './dto/update-discovery-geo-preferences.dto';
import {
  DISCOVERY_AREAS_ONBOARDING_KEY,
  DISCOVERY_AREAS_ONBOARDING_VERSION,
} from './user-onboarding.constants';
import { PUBLIC_SUMMIT_WHERE } from '../summits/summit-publication';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.user
      .findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
          firstName: true,
          email: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
          geoAreaPreferences: {
            where: { type: UserGeoAreaPreferenceType.DISCOVERY },
            select: { id: true },
            take: 1,
          },
          onboardingStates: {
            where: {
              key: DISCOVERY_AREAS_ONBOARDING_KEY,
              version: { gte: DISCOVERY_AREAS_ONBOARDING_VERSION },
            },
            select: { id: true },
            take: 1,
          },
        },
      })
      .then((profile) =>
        profile
          ? {
              ...profile,
              geoAreaPreferences: undefined,
              onboardingStates: undefined,
              needsDiscoveryOnboarding:
                profile.geoAreaPreferences.length === 0 &&
                profile.onboardingStates.length === 0,
            }
          : null,
      );
  }

  async getGeoPreferences(userId: string) {
    const [preferences, onboardingState] = await Promise.all([
      this.prisma.userGeoAreaPreference.findMany({
        where: { userId, type: UserGeoAreaPreferenceType.DISCOVERY },
        include: { geoArea: true },
        orderBy: { geoArea: { name: 'asc' } },
      }),
      this.prisma.userOnboardingState.findUnique({
        where: {
          userId_key: { userId, key: DISCOVERY_AREAS_ONBOARDING_KEY },
        },
      }),
    ]);

    return {
      discovery: preferences.map(({ geoArea }) => geoArea),
      onboardingCompleted:
        Boolean(onboardingState) &&
        onboardingState!.version >= DISCOVERY_AREAS_ONBOARDING_VERSION,
    };
  }

  async updateDiscoveryGeoPreferences(
    userId: string,
    dto: UpdateDiscoveryGeoPreferencesDto,
  ) {
    const geoAreaIds = [...new Set(dto.geoAreaIds)];
    const eligibleAreas = await this.prisma.geoArea.findMany({
      where: {
        id: { in: geoAreaIds },
        isPublished: true,
        type: { in: [GeoAreaType.DEPARTMENT, GeoAreaType.MASSIF] },
        summitLinks: { some: { summit: PUBLIC_SUMMIT_WHERE } },
      },
      select: { id: true },
    });

    if (eligibleAreas.length !== geoAreaIds.length) {
      throw new NotFoundException(
        'Un ou plusieurs territoires ne sont pas disponibles',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.userGeoAreaPreference.deleteMany({
        where: { userId, type: UserGeoAreaPreferenceType.DISCOVERY },
      });

      if (geoAreaIds.length > 0) {
        await transaction.userGeoAreaPreference.createMany({
          data: geoAreaIds.map((geoAreaId) => ({
            userId,
            geoAreaId,
            type: UserGeoAreaPreferenceType.DISCOVERY,
          })),
          skipDuplicates: true,
        });
      }

      await transaction.userOnboardingState.upsert({
        where: {
          userId_key: { userId, key: DISCOVERY_AREAS_ONBOARDING_KEY },
        },
        create: {
          userId,
          key: DISCOVERY_AREAS_ONBOARDING_KEY,
          version: DISCOVERY_AREAS_ONBOARDING_VERSION,
          completedAt: new Date(),
        },
        update: {
          version: DISCOVERY_AREAS_ONBOARDING_VERSION,
          completedAt: new Date(),
        },
      });
    });

    return this.getGeoPreferences(userId);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        ...(dto.firstName && {
          firstName: dto.firstName,
        }),

        ...(dto.avatarUrl && {
          avatarUrl: dto.avatarUrl,
        }),
      },

      select: {
        id: true,
        firstName: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const passwordMatch = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!passwordMatch) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, BCRYPT_COST);

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
      message: 'Mot de passe mis à jour',
    };
  }
}
