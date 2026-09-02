import { Injectable, Logger } from '@nestjs/common';
import { ActivityStatus, Prisma } from '@prisma/client';

import { ActivityMailSchedulerService } from '../../mail/scheduling/activity-mail-scheduler.service';
import { PrismaService } from '../../prisma/prisma.service';

const AUTO_MATCH_WINDOW_MS = 6 * 60 * 60 * 1000;

type ReconciliationResult = {
  matched: number;
  skippedAmbiguous: number;
};

@Injectable()
export class PlannedWorkoutReconciliationService {
  private readonly logger = new Logger(
    PlannedWorkoutReconciliationService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailScheduler: ActivityMailSchedulerService,
  ) {}

  async reconcileStravaActivities(
    userId: string,
    activityIds: string[],
  ): Promise<ReconciliationResult> {
    const uniqueActivityIds = [...new Set(activityIds)];
    let matched = 0;
    let skippedAmbiguous = 0;

    for (const activityId of uniqueActivityIds) {
      try {
        const result = await this.reconcileActivity(userId, activityId);

        if (result.status === 'matched') {
          matched += 1;
          await this.scheduleCompletionEmails(result);
        } else if (result.status === 'ambiguous') {
          skippedAmbiguous += 1;
        }
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          continue;
        }

        this.logger.warn({
          userId,
          activityId,
          message: 'Planned workout reconciliation skipped',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { matched, skippedAmbiguous };
  }

  private async reconcileActivity(userId: string, activityId: string) {
    return this.prisma.$transaction(async (tx) => {
      const completedActivity = await tx.activity.findFirst({
        where: {
          id: activityId,
          userId,
          status: ActivityStatus.COMPLETED,
          stravaActivityId: { not: null },
        },
        select: {
          id: true,
          sport: true,
          startedAt: true,
        },
      });

      if (!completedActivity) {
        return { status: 'skipped' as const };
      }

      const existingLink = await tx.plannedWorkoutCompletion.findUnique({
        where: { completedActivityId: completedActivity.id },
        select: { id: true },
      });

      if (existingLink) {
        return { status: 'skipped' as const };
      }

      const candidates = await tx.activity.findMany({
        where: {
          userId,
          sport: completedActivity.sport,
          status: ActivityStatus.PLANNED,
          startedAt: {
            gte: new Date(
              completedActivity.startedAt.getTime() - AUTO_MATCH_WINDOW_MS,
            ),
            lte: new Date(
              completedActivity.startedAt.getTime() + AUTO_MATCH_WINDOW_MS,
            ),
          },
        },
        select: { id: true },
      });

      if (candidates.length === 0) {
        return { status: 'skipped' as const };
      }

      const linkedCandidates = await tx.plannedWorkoutCompletion.findMany({
        where: {
          plannedWorkoutId: { in: candidates.map(({ id }) => id) },
        },
        select: { plannedWorkoutId: true },
      });
      const linkedCandidateIds = new Set(
        linkedCandidates.map(({ plannedWorkoutId }) => plannedWorkoutId),
      );
      const availableCandidates = candidates.filter(
        ({ id }) => !linkedCandidateIds.has(id),
      );

      if (availableCandidates.length !== 1) {
        return {
          status:
            availableCandidates.length > 1
              ? ('ambiguous' as const)
              : ('skipped' as const),
        };
      }

      const plannedWorkoutId = availableCandidates[0].id;
      const completedAt = new Date();

      await tx.plannedWorkoutCompletion.create({
        data: {
          plannedWorkoutId,
          completedActivityId: completedActivity.id,
          completedAt,
        },
      });
      await tx.activity.update({
        where: { id: plannedWorkoutId },
        data: { status: ActivityStatus.COMPLETED },
      });

      return {
        status: 'matched' as const,
        plannedWorkoutId,
        completedAt,
      };
    });
  }

  private async scheduleCompletionEmails(input: {
    plannedWorkoutId: string;
    completedAt: Date;
  }) {
    try {
      await Promise.all([
        this.mailScheduler.cancelUpcomingActivityReminder(
          input.plannedWorkoutId,
        ),
        this.mailScheduler.scheduleCompletedActivityCongratulations({
          activityId: input.plannedWorkoutId,
          completedAt: input.completedAt,
        }),
      ]);
    } catch (error) {
      this.logger.warn({
        plannedWorkoutId: input.plannedWorkoutId,
        message: 'Completion emails could not be updated after reconciliation',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
