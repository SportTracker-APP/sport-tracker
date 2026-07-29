import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Activity,
  ActivityStatus,
  PlannedWorkoutCompletion,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ActivityMailSchedulerService } from '../../mail/scheduling/activity-mail-scheduler.service';
import { StravaService } from '../strava/strava.service';
import { SummitsService } from '../summits/summits.service';

import { CreateActivityDto } from './dto/create-activity.dto';
import { CompletePlannedWorkoutDto } from './dto/complete-planned-workout.dto';

import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stravaService: StravaService,
    private readonly activityMailScheduler: ActivityMailSchedulerService,
    private readonly summitsService: SummitsService,
  ) {}

  async create(userId: string, dto: CreateActivityDto) {
    if (dto.plannedWorkoutId) {
      return this.createFromPlannedWorkout(userId, dto);
    }

    const { plannedWorkoutId: _plannedWorkoutId, ...activityData } = dto;

    const activity = await this.prisma.activity.create({
      data: {
        ...activityData,

        startedAt: new Date(dto.startedAt),

        userId,
      },
    });

    if (activity.status === ActivityStatus.PLANNED) {
      await this.activityMailScheduler.scheduleUpcomingActivityReminder(
        activity.id,
      );
    }

    if (activity.status === ActivityStatus.COMPLETED) {
      await this.processSummitsSafely(userId, [activity.id]);
    }

    return activity;
  }

  async findAll(userId: string) {
    const activities = await this.prisma.activity.findMany({
      where: {
        userId,
      },

      orderBy: {
        startedAt: 'desc',
      },
    });

    return this.withCompletionData(activities);
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
      return (await this.withCompletionData([activity]))[0];
    }

    try {
      const enrichment = await this.stravaService.getActivityEnrichment(
        userId,
        activity.stravaActivityId,
      );

      const decoratedActivity = (await this.withCompletionData([activity]))[0];

      return {
        ...decoratedActivity,
        ...activity,
        ...enrichment,
        coverImageUrl: enrichment.coverImageUrl ?? activity.coverImageUrl,
        maxAltitude: enrichment.maxAltitude ?? activity.maxAltitude,
        minAltitude: enrichment.minAltitude,
      };
    } catch (error) {
      this.logger.warn({
        activityId,
        sport: activity.sport,
        message: 'Strava elevation profile unavailable for activity detail',
      });
    }

    return (await this.withCompletionData([activity]))[0];
  }

  async update(userId: string, activityId: string, dto: UpdateActivityDto) {
    const currentActivity = await this.findOne(userId, activityId);
    const { plannedWorkoutId: _plannedWorkoutId, ...activityData } = dto;

    const updatedActivity = await this.prisma.activity.update({
      where: {
        id: activityId,
      },

      data: {
        ...activityData,

        ...(dto.startedAt && {
          startedAt: new Date(dto.startedAt),
        }),
      },
    });

    if (updatedActivity.status === ActivityStatus.PLANNED) {
      await this.activityMailScheduler.rescheduleUpcomingActivityReminder(
        updatedActivity.id,
      );
    } else if (currentActivity.status === ActivityStatus.PLANNED) {
      await this.activityMailScheduler.cancelUpcomingActivityReminder(
        updatedActivity.id,
      );
    }

    if (updatedActivity.status === ActivityStatus.COMPLETED) {
      await this.processSummitsSafely(userId, [updatedActivity.id]);
    }

    return updatedActivity;
  }

  async completePlannedWorkout(
    userId: string,
    plannedWorkoutId: string,
    dto: CompletePlannedWorkoutDto,
  ) {
    const completedWorkout = await this.prisma.$transaction((tx) =>
      this.linkCompletedActivity(tx, userId, plannedWorkoutId, dto.activityId),
    );

    await this.activityMailScheduler.cancelUpcomingActivityReminder(
      plannedWorkoutId,
    );

    if (completedWorkout.completedAt) {
      await this.activityMailScheduler.scheduleCompletedActivityCongratulations(
        {
          activityId: plannedWorkoutId,
          completedAt: completedWorkout.completedAt,
        },
      );
    }

    if (completedWorkout.completedActivityId) {
      await this.processSummitsSafely(userId, [
        completedWorkout.completedActivityId,
      ]);
    }

    return completedWorkout;
  }

  async markCelebrationSeen(userId: string, plannedWorkoutId: string) {
    const plannedWorkout = await this.prisma.activity.findFirst({
      where: {
        id: plannedWorkoutId,
        userId,
      },
    });

    if (!plannedWorkout) {
      throw new NotFoundException('Séance planifiée introuvable');
    }

    const completion = await this.prisma.plannedWorkoutCompletion.findUnique({
      where: {
        plannedWorkoutId,
      },
    });

    if (!completion) {
      throw new NotFoundException('Réalisation de séance introuvable');
    }

    await this.prisma.plannedWorkoutCompletion.update({
      where: {
        plannedWorkoutId,
      },
      data: {
        celebrationSeenAt: new Date(),
      },
    });

    return (await this.withCompletionData([plannedWorkout]))[0];
  }

  async findPlannedWorkoutSuggestion(userId: string, activityId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: {
        id: activityId,
        userId,
      },
    });

    if (!activity) {
      throw new NotFoundException('Activité introuvable');
    }

    if (activity.status !== ActivityStatus.COMPLETED) {
      return null;
    }

    const existingLink = await this.findCompletionForActivity(activity.id);

    if (existingLink) {
      return null;
    }

    const startedAt = new Date(activity.startedAt);
    const from = new Date(startedAt);
    from.setHours(from.getHours() - 36);
    const to = new Date(startedAt);
    to.setHours(to.getHours() + 36);

    const completions = await this.findCompletionRowsForUser(userId);
    const completedPlannedWorkoutIds = new Set(
      completions.map((completion) => completion.plannedWorkoutId),
    );

    return this.prisma.activity.findFirst({
      where: {
        userId,
        sport: activity.sport,
        status: ActivityStatus.PLANNED,
        id: {
          notIn: Array.from(completedPlannedWorkoutIds),
        },
        startedAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: {
        startedAt: 'asc',
      },
    });
  }

  async remove(userId: string, activityId: string) {
    await this.findOne(userId, activityId);
    await this.activityMailScheduler.cancelUpcomingActivityReminder(activityId);

    return this.prisma.activity.delete({
      where: {
        id: activityId,
      },
    });
  }

  private async createFromPlannedWorkout(
    userId: string,
    dto: CreateActivityDto,
  ) {
    const { plannedWorkoutId, ...activityData } = dto;

    if (!plannedWorkoutId) {
      throw new BadRequestException('Séance planifiée manquante');
    }

    const completedWorkout = await this.prisma.$transaction(async (tx) => {
      const activity = await tx.activity.create({
        data: {
          ...activityData,
          status: ActivityStatus.COMPLETED,
          startedAt: new Date(dto.startedAt),
          userId,
        },
      });

      return this.linkCompletedActivity(
        tx,
        userId,
        plannedWorkoutId,
        activity.id,
      );
    });

    await this.activityMailScheduler.cancelUpcomingActivityReminder(
      plannedWorkoutId,
    );

    if (completedWorkout.completedAt) {
      await this.activityMailScheduler.scheduleCompletedActivityCongratulations(
        {
          activityId: plannedWorkoutId,
          completedAt: completedWorkout.completedAt,
        },
      );
    }

    if (completedWorkout.completedActivityId) {
      await this.processSummitsSafely(userId, [
        completedWorkout.completedActivityId,
      ]);
    }

    return completedWorkout;
  }

  private async linkCompletedActivity(
    tx: Prisma.TransactionClient,
    userId: string,
    plannedWorkoutId: string,
    activityId: string,
  ) {
    const plannedWorkout = await tx.activity.findFirst({
      where: {
        id: plannedWorkoutId,
        userId,
      },
    });

    if (!plannedWorkout) {
      throw new NotFoundException('Séance planifiée introuvable');
    }

    if (plannedWorkout.status === ActivityStatus.COMPLETED) {
      throw new ConflictException('Cette séance est déjà terminée');
    }

    if (plannedWorkout.status === ActivityStatus.CANCELED) {
      throw new ConflictException(
        'Cette séance est annulée et ne peut pas être terminée directement',
      );
    }

    if (plannedWorkout.status !== ActivityStatus.PLANNED) {
      throw new BadRequestException('Cette séance ne peut pas être terminée');
    }

    const activity = await tx.activity.findFirst({
      where: {
        id: activityId,
        userId,
      },
    });

    if (!activity) {
      throw new NotFoundException('Activité introuvable');
    }

    if (activity.status !== ActivityStatus.COMPLETED) {
      throw new BadRequestException(
        'Seule une activité terminée peut valider une séance',
      );
    }

    const existingActivityLink = await tx.plannedWorkoutCompletion.findFirst({
      where: {
        completedActivityId: activity.id,
      },
    });

    if (
      existingActivityLink &&
      existingActivityLink.plannedWorkoutId !== plannedWorkoutId
    ) {
      throw new ConflictException(
        'Cette activité est déjà associée à une séance',
      );
    }

    const completedAt = new Date();

    await tx.plannedWorkoutCompletion.create({
      data: {
        plannedWorkoutId,
        completedActivityId: activity.id,
        completedAt,
      },
    });

    const completedWorkout = await tx.activity.update({
      where: {
        id: plannedWorkout.id,
      },
      data: {
        status: ActivityStatus.COMPLETED,
      },
    });

    return this.decorateActivity(completedWorkout, {
      plannedWorkoutId,
      completedActivityId: activity.id,
      completedAt,
      celebrationSeenAt: null,
      completedActivity: activity,
      plannedWorkout: null,
    });
  }

  private async withCompletionData(activities: Activity[]) {
    if (activities.length === 0) {
      return [];
    }

    try {
      const activityIds = activities.map((activity) => activity.id);
      const completions = await this.prisma.plannedWorkoutCompletion.findMany({
        where: {
          OR: [
            {
              plannedWorkoutId: {
                in: activityIds,
              },
            },
            {
              completedActivityId: {
                in: activityIds,
              },
            },
          ],
        },
        include: {
          plannedWorkout: true,
          completedActivity: true,
        },
      });

      return activities.map((activity) => {
        const completion = completions.find(
          (item) =>
            item.plannedWorkoutId === activity.id ||
            item.completedActivityId === activity.id,
        );

        if (!completion) {
          return this.decorateActivity(activity);
        }

        return this.decorateActivity(activity, {
          plannedWorkoutId:
            completion.completedActivityId === activity.id
              ? completion.plannedWorkoutId
              : null,
          completedActivityId:
            completion.plannedWorkoutId === activity.id
              ? completion.completedActivityId
              : null,
          completedAt: completion.completedAt,
          celebrationSeenAt: completion.celebrationSeenAt,
          plannedWorkout:
            completion.completedActivityId === activity.id
              ? completion.plannedWorkout
              : null,
          completedActivity:
            completion.plannedWorkoutId === activity.id
              ? completion.completedActivity
              : null,
        });
      });
    } catch (error) {
      console.warn('Planned workout completion data skipped:', {
        message: error instanceof Error ? error.message : String(error),
      });

      return activities.map((activity) => this.decorateActivity(activity));
    }
  }

  private decorateActivity(
    activity: Activity,
    completion?: {
      plannedWorkoutId: string | null;
      completedActivityId: string | null;
      completedAt: Date | null;
      celebrationSeenAt: Date | null;
      plannedWorkout: Activity | null;
      completedActivity: Activity | null;
    },
  ) {
    return {
      ...activity,
      plannedWorkoutId: completion?.plannedWorkoutId ?? null,
      completedActivityId: completion?.completedActivityId ?? null,
      completedAt: completion?.completedAt ?? null,
      celebrationSeenAt: completion?.celebrationSeenAt ?? null,
      plannedWorkout: completion?.plannedWorkout ?? null,
      completedActivity: completion?.completedActivity ?? null,
    };
  }

  private async findCompletionForActivity(activityId: string) {
    try {
      return await this.prisma.plannedWorkoutCompletion.findFirst({
        where: {
          completedActivityId: activityId,
        },
      });
    } catch {
      return null;
    }
  }

  private async findCompletionRowsForUser(userId: string) {
    try {
      return await this.prisma.plannedWorkoutCompletion.findMany({
        where: {
          plannedWorkout: {
            userId,
          },
        },
      });
    } catch {
      return [] as PlannedWorkoutCompletion[];
    }
  }

  private async processSummitsSafely(
    userId: string,
    activityIds: string[],
  ): Promise<void> {
    try {
      await this.summitsService.processActivities(userId, activityIds);
    } catch (error) {
      this.logger.warn({
        activityCount: activityIds.length,
        errorName: error instanceof Error ? error.name : 'UnknownError',
        message: 'Summit detection skipped after activity change',
      });
    }
  }
}
