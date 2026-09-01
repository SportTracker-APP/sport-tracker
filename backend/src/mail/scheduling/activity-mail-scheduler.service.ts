import { Injectable, Logger } from '@nestjs/common';
import {
  ActivityStatus,
  ScheduledEmailStatus,
  ScheduledEmailType,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ActivityMailTimeService } from './activity-mail-time.service';

const MUTABLE_SCHEDULED_EMAIL_STATUSES = [
  ScheduledEmailStatus.PENDING,
  ScheduledEmailStatus.PROCESSING,
  ScheduledEmailStatus.FAILED,
] as const;

@Injectable()
export class ActivityMailSchedulerService {
  private readonly logger = new Logger(ActivityMailSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly timeService: ActivityMailTimeService,
  ) {}

  async scheduleUpcomingActivityReminder(
    activityId: string,
    now = new Date(),
  ): Promise<void> {
    const activity = await this.prisma.activity.findUnique({
      where: {
        id: activityId,
      },
      include: {
        user: {
          select: {
            id: true,
            emailVerifiedAt: true,
          },
        },
      },
    });

    if (!activity) {
      await this.cancelUpcomingActivityReminder(activityId);
      return;
    }

    if (
      activity.status !== ActivityStatus.PLANNED ||
      !activity.user.emailVerifiedAt
    ) {
      await this.cancelUpcomingActivityReminder(activity.id);
      return;
    }

    const scheduledAt = this.timeService.calculateUpcomingReminderAt({
      activityStartsAt: activity.startedAt,
      timezone: this.resolveUserTimezone(),
      now,
    });

    if (!scheduledAt) {
      await this.cancelUpcomingActivityReminder(activity.id);
      return;
    }

    await this.upsertPendingScheduledEmail({
      userId: activity.userId,
      activityId: activity.id,
      type: ScheduledEmailType.ACTIVITY_UPCOMING_REMINDER,
      scheduledAt,
    });
  }

  async rescheduleUpcomingActivityReminder(
    activityId: string,
    now = new Date(),
  ): Promise<void> {
    await this.scheduleUpcomingActivityReminder(activityId, now);
  }

  async cancelUpcomingActivityReminder(activityId: string): Promise<void> {
    await this.cancelScheduledEmail(
      activityId,
      ScheduledEmailType.ACTIVITY_UPCOMING_REMINDER,
    );
  }

  async scheduleCompletedActivityCongratulations(input: {
    activityId: string;
    completedAt: Date;
    now?: Date;
  }): Promise<void> {
    const activity = await this.prisma.activity.findUnique({
      where: {
        id: input.activityId,
      },
      include: {
        user: {
          select: {
            id: true,
            emailVerifiedAt: true,
          },
        },
      },
    });

    if (
      !activity ||
      activity.status !== ActivityStatus.COMPLETED ||
      !activity.user.emailVerifiedAt
    ) {
      return;
    }

    const scheduledAt = this.timeService.calculateCompletedCongratulationsAt({
      completedAt: input.completedAt,
      timezone: this.resolveUserTimezone(),
      now: input.now,
    });

    if (!scheduledAt) {
      this.logger.log({
        emailType: 'activity.completed_congratulations',
        activityId: input.activityId,
        message:
          'Completed activity email skipped because completion is too old',
      });
      return;
    }

    await this.upsertPendingScheduledEmail({
      userId: activity.userId,
      activityId: activity.id,
      type: ScheduledEmailType.ACTIVITY_COMPLETED_CONGRATULATIONS,
      scheduledAt,
    });
  }

  private async upsertPendingScheduledEmail(input: {
    userId: string;
    activityId: string;
    type: ScheduledEmailType;
    scheduledAt: Date;
  }): Promise<void> {
    const existing = await this.prisma.scheduledEmail.findUnique({
      where: {
        activityId_type: {
          activityId: input.activityId,
          type: input.type,
        },
      },
    });

    if (existing?.status === ScheduledEmailStatus.SENT) {
      return;
    }

    if (existing) {
      await this.prisma.scheduledEmail.update({
        where: {
          id: existing.id,
        },
        data: {
          userId: input.userId,
          scheduledAt: input.scheduledAt,
          status: ScheduledEmailStatus.PENDING,
          sentAt: null,
          processingStartedAt: null,
          attemptCount: 0,
          lastError: null,
        },
      });
      return;
    }

    await this.prisma.scheduledEmail.create({
      data: {
        userId: input.userId,
        activityId: input.activityId,
        type: input.type,
        scheduledAt: input.scheduledAt,
      },
    });
  }

  private async cancelScheduledEmail(
    activityId: string,
    type: ScheduledEmailType,
  ): Promise<void> {
    await this.prisma.scheduledEmail.updateMany({
      where: {
        activityId,
        type,
        status: {
          in: [...MUTABLE_SCHEDULED_EMAIL_STATUSES],
        },
      },
      data: {
        status: ScheduledEmailStatus.CANCELLED,
        processingStartedAt: null,
      },
    });
  }

  private resolveUserTimezone(): string {
    return this.timeService.getDefaultTimezone();
  }
}
