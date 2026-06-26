import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ActivityStatus,
  Prisma,
  ScheduledEmailStatus,
  ScheduledEmailType,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { MAIL_CONFIG } from '../mail.constants';
import { MailService } from '../mail.service';
import type { MailConfig } from '../mail.types';
import { maskEmailAddress } from '../providers/resend-mail.provider';
import {
  formatActivityDate,
  formatActivityLocation,
  formatActivityName,
  formatActivityTime,
  formatDistance,
  formatDuration,
  formatElevationGain,
  formatSportName,
} from './activity-mail-formatters';
import { ActivityMailTimeService } from './activity-mail-time.service';

const WORKER_BATCH_SIZE = 20;
const STUCK_PROCESSING_AFTER_MS = 15 * 60 * 1000;
const MAX_SEND_DELAY_MS = 48 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [15 * 60 * 1000, 60 * 60 * 1000] as const;
const MAX_STORED_ERROR_LENGTH = 300;

type ScheduledEmailWithRelations = Prisma.ScheduledEmailGetPayload<{
  include: {
    user: true;
    activity: {
      include: {
        plannedWorkoutCompletion: {
          include: {
            completedActivity: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class ActivityMailWorkerService {
  private readonly logger = new Logger(ActivityMailWorkerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly timeService: ActivityMailTimeService,
    @Inject(MAIL_CONFIG) private readonly config: MailConfig,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async processDueEmails(): Promise<void> {
    const now = new Date();

    await this.releaseStuckEmails(now);

    const dueEmails = await this.prisma.scheduledEmail.findMany({
      where: {
        status: ScheduledEmailStatus.PENDING,
        scheduledAt: {
          lte: now,
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      take: WORKER_BATCH_SIZE,
    });

    for (const dueEmail of dueEmails) {
      await this.processOne(dueEmail.id, now);
    }
  }

  private async releaseStuckEmails(now: Date): Promise<void> {
    await this.prisma.scheduledEmail.updateMany({
      where: {
        status: ScheduledEmailStatus.PROCESSING,
        processingStartedAt: {
          lt: new Date(now.getTime() - STUCK_PROCESSING_AFTER_MS),
        },
      },
      data: {
        status: ScheduledEmailStatus.PENDING,
        processingStartedAt: null,
        scheduledAt: now,
      },
    });
  }

  private async processOne(id: string, now: Date): Promise<void> {
    const claimed = await this.prisma.scheduledEmail.updateMany({
      where: {
        id,
        status: ScheduledEmailStatus.PENDING,
      },
      data: {
        status: ScheduledEmailStatus.PROCESSING,
        processingStartedAt: now,
      },
    });

    if (claimed.count !== 1) {
      return;
    }

    const scheduledEmail = await this.prisma.scheduledEmail.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
        activity: {
          include: {
            plannedWorkoutCompletion: {
              include: {
                completedActivity: true,
              },
            },
          },
        },
      },
    });

    if (!scheduledEmail) {
      return;
    }

    try {
      await this.sendScheduledEmail(scheduledEmail, now);
    } catch (error) {
      await this.handleSendError(scheduledEmail, error, now);
    }
  }

  private async sendScheduledEmail(
    scheduledEmail: ScheduledEmailWithRelations,
    now: Date,
  ): Promise<void> {
    if (!scheduledEmail.user.emailVerifiedAt) {
      await this.cancelEmail(scheduledEmail.id, 'User email is not verified');
      return;
    }

    if (now.getTime() - scheduledEmail.scheduledAt.getTime() > MAX_SEND_DELAY_MS) {
      await this.cancelEmail(scheduledEmail.id, 'Scheduled email is too old');
      return;
    }

    if (
      scheduledEmail.type === ScheduledEmailType.ACTIVITY_UPCOMING_REMINDER
    ) {
      await this.sendUpcomingReminder(scheduledEmail, now);
      return;
    }

    await this.sendCompletedCongratulations(scheduledEmail);
  }

  private async sendUpcomingReminder(
    scheduledEmail: ScheduledEmailWithRelations,
    now: Date,
  ): Promise<void> {
    const activity = scheduledEmail.activity;

    if (
      activity.status !== ActivityStatus.PLANNED ||
      activity.startedAt.getTime() <= now.getTime()
    ) {
      await this.cancelEmail(scheduledEmail.id, 'Activity is no longer planned');
      return;
    }

    const timezone = this.timeService.getDefaultTimezone();
    const result = await this.mailService.sendActivityUpcomingReminderEmail({
      to: scheduledEmail.user.email,
      userName: scheduledEmail.user.firstName,
      activityName: formatActivityName(activity.title),
      sportName: formatSportName(activity.sport),
      activityDate: formatActivityDate(activity.startedAt, timezone),
      activityTime: formatActivityTime(activity.startedAt, timezone),
      activityLocation: formatActivityLocation({
        city: activity.city,
        country: activity.country,
      }),
      activityUrl: this.buildActivityUrl(activity.id),
      businessId: scheduledEmail.id,
    });

    await this.markSent(scheduledEmail.id, result.resendId);
  }

  private async sendCompletedCongratulations(
    scheduledEmail: ScheduledEmailWithRelations,
  ): Promise<void> {
    const activity = scheduledEmail.activity;
    const completion = activity.plannedWorkoutCompletion;

    if (activity.status !== ActivityStatus.COMPLETED || !completion) {
      await this.cancelEmail(
        scheduledEmail.id,
        'Activity is not a completed planned workout',
      );
      return;
    }

    const completedActivity = completion.completedActivity;
    const timezone = this.timeService.getDefaultTimezone();
    const result =
      await this.mailService.sendActivityCompletedCongratulationsEmail({
        to: scheduledEmail.user.email,
        userName: scheduledEmail.user.firstName,
        activityName: formatActivityName(activity.title),
        sportName: formatSportName(activity.sport),
        activityDate: formatActivityDate(completion.completedAt, timezone),
        distance: formatDistance(completedActivity.distance),
        duration: formatDuration(completedActivity.duration),
        elevationGain: formatElevationGain(completedActivity.elevationGain),
        activityUrl: this.buildActivityUrl(activity.id),
        businessId: scheduledEmail.id,
      });

    await this.markSent(scheduledEmail.id, result.resendId);
  }

  private async markSent(
    scheduledEmailId: string,
    resendId: string | undefined,
  ): Promise<void> {
    await this.prisma.scheduledEmail.update({
      where: {
        id: scheduledEmailId,
      },
      data: {
        status: ScheduledEmailStatus.SENT,
        sentAt: new Date(),
        processingStartedAt: null,
        lastError: null,
      },
    });

    this.logger.log({
      scheduledEmailId,
      resendId,
      message: 'Scheduled activity email sent',
    });
  }

  private async cancelEmail(id: string, reason: string): Promise<void> {
    await this.prisma.scheduledEmail.update({
      where: {
        id,
      },
      data: {
        status: ScheduledEmailStatus.CANCELLED,
        processingStartedAt: null,
        lastError: reason,
      },
    });
  }

  private async handleSendError(
    scheduledEmail: ScheduledEmailWithRelations,
    error: unknown,
    now: Date,
  ): Promise<void> {
    const nextAttemptCount = scheduledEmail.attemptCount + 1;
    const sanitizedError = sanitizeError(error);
    const shouldFail = nextAttemptCount >= MAX_ATTEMPTS;
    const retryDelay = getRetryDelayMs(nextAttemptCount);

    await this.prisma.scheduledEmail.update({
      where: {
        id: scheduledEmail.id,
      },
      data: {
        status: shouldFail
          ? ScheduledEmailStatus.FAILED
          : ScheduledEmailStatus.PENDING,
        attemptCount: nextAttemptCount,
        lastError: sanitizedError,
        processingStartedAt: null,
        scheduledAt: shouldFail
          ? scheduledEmail.scheduledAt
          : new Date(now.getTime() + retryDelay),
      },
    });

    this.logger.error({
      scheduledEmailId: scheduledEmail.id,
      emailType: scheduledEmail.type,
      recipient: maskEmailAddress(scheduledEmail.user.email),
      attemptCount: nextAttemptCount,
      message: shouldFail
        ? 'Scheduled activity email failed permanently'
        : 'Scheduled activity email will be retried',
    });
  }

  private buildActivityUrl(activityId: string): string {
    return new URL(`/activites/${activityId}`, this.config.appBaseUrl).toString();
  }
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown email error';

  return message.slice(0, MAX_STORED_ERROR_LENGTH);
}

function getRetryDelayMs(attemptCount: number): number {
  return RETRY_DELAYS_MS[attemptCount - 1] ?? RETRY_DELAYS_MS[0];
}
