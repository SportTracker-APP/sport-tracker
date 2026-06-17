import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { StravaService } from '../strava/strava.service';

import { CreateActivityDto } from './dto/create-activity.dto';

import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stravaService: StravaService,
  ) {}

  async create(userId: string, dto: CreateActivityDto) {
    return this.prisma.activity.create({
      data: {
        ...dto,

        startedAt: new Date(dto.startedAt),

        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.activity.findMany({
      where: {
        userId,
      },

      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  async findOne(userId: string, activityId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: {
        id: activityId,
        userId,
      },
    });

    if (!activity) {
      throw new NotFoundException('Activité introuvable');
    }

    if (!activity.stravaActivityId) {
      return activity;
    }

    try {
      const enrichment = await this.stravaService.getActivityEnrichment(
        userId,
        activity.stravaActivityId,
      );

      return {
        ...activity,
        ...enrichment,
        coverImageUrl: enrichment.coverImageUrl ?? activity.coverImageUrl,
        maxAltitude: enrichment.maxAltitude ?? activity.maxAltitude,
        minAltitude: enrichment.minAltitude,
      };
    } catch (error) {
      console.warn('Strava enrichment skipped for activity detail:', {
        activityId,
        stravaActivityId: activity.stravaActivityId,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    return activity;
  }

  async update(userId: string, activityId: string, dto: UpdateActivityDto) {
    await this.findOne(userId, activityId);

    return this.prisma.activity.update({
      where: {
        id: activityId,
      },

      data: {
        ...dto,

        ...(dto.startedAt && {
          startedAt: new Date(dto.startedAt),
        }),
      },
    });
  }

  async remove(userId: string, activityId: string) {
    await this.findOne(userId, activityId);

    return this.prisma.activity.delete({
      where: {
        id: activityId,
      },
    });
  }
}
