import { Logger } from '@nestjs/common';
import {
  ActivityStatus,
  ActivityType,
  ScheduledEmailStatus,
  ScheduledEmailType,
  SportType,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail.service';
import type { MailConfig } from '../mail.types';
import { ActivityMailTimeService } from '../scheduling/activity-mail-time.service';
import { ActivityMailWorkerService } from '../scheduling/activity-mail-worker.service';

type PrismaMock = {
  scheduledEmail: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
};

type MailServiceMock = {
  sendActivityUpcomingReminderEmail: jest.Mock;
  sendActivityCompletedCongratulationsEmail: jest.Mock;
};

type TimeServiceMock = {
  getDefaultTimezone: jest.Mock;
};

const config: MailConfig = {
  enabled: true,
  apiKey: 'resend-api-key',
  from: 'Hovren <sender@example.test>',
  replyTo: 'support@example.test',
  appBaseUrl: 'http://localhost:3000',
  defaultTimezone: 'Europe/Paris',
  templates: {
    authVerify: 'auth-verify-email',
    authWelcome: 'auth-welcome',
    authResetPassword: 'auth-reset-password',
    authPasswordChanged: 'auth-password-changed',
    activityFirstCreated: 'activity-first-created',
    activityUpcomingReminder: 'activity-upcoming-reminder',
    activityCompletedCongratulations: 'activity-completed-congratulations',
    summitFirstValidated: 'summit-first-validated',
  },
};

function makePrismaMock(): PrismaMock {
  return {
    scheduledEmail: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      updateMany: jest.fn(),
    },
  };
}

function makeMailServiceMock(): MailServiceMock {
  return {
    sendActivityUpcomingReminderEmail: jest
      .fn()
      .mockResolvedValue({ skipped: false, resendId: 'resend-1' }),
    sendActivityCompletedCongratulationsEmail: jest
      .fn()
      .mockResolvedValue({ skipped: false, resendId: 'resend-2' }),
  };
}

function makeTimeServiceMock(): TimeServiceMock {
  return {
    getDefaultTimezone: jest.fn().mockReturnValue('Europe/Paris'),
  };
}

function makeDueEmail(
  type: ScheduledEmailType = ScheduledEmailType.ACTIVITY_UPCOMING_REMINDER,
) {
  return {
    id: 'scheduled-email-1',
    userId: 'user-1',
    activityId: 'activity-1',
    type,
    status: ScheduledEmailStatus.PENDING,
    scheduledAt: new Date('2026-06-27T13:00:00.000Z'),
    sentAt: null,
    attemptCount: 0,
    lastError: null,
    processingStartedAt: null,
    createdAt: new Date('2026-06-27T08:00:00.000Z'),
    updatedAt: new Date('2026-06-27T08:00:00.000Z'),
  };
}

function makeScheduledEmailWithRelations(
  overrides: Record<string, unknown> = {},
) {
  return {
    ...makeDueEmail(),
    user: {
      id: 'user-1',
      firstName: 'Camille',
      email: 'camille@example.test',
      emailVerifiedAt: new Date('2026-06-20T08:00:00.000Z'),
    },
    activity: {
      id: 'activity-1',
      title: 'Sortie longue',
      city: 'Annecy',
      country: 'France',
      type: ActivityType.TRAINING,
      sport: SportType.TRAIL,
      status: ActivityStatus.PLANNED,
      distance: 12.4,
      duration: 6120,
      elevationGain: 640,
      startedAt: new Date('2026-06-27T16:00:00.000Z'),
      plannedWorkoutCompletion: null,
    },
    ...overrides,
  };
}

function makeCompletedScheduledEmail() {
  return makeScheduledEmailWithRelations({
    type: ScheduledEmailType.ACTIVITY_COMPLETED_CONGRATULATIONS,
    activity: {
      id: 'activity-1',
      title: 'Sortie longue',
      city: 'Annecy',
      country: 'France',
      type: ActivityType.TRAINING,
      sport: SportType.TRAIL,
      status: ActivityStatus.COMPLETED,
      distance: null,
      duration: 3600,
      elevationGain: null,
      startedAt: new Date('2026-06-27T16:00:00.000Z'),
      plannedWorkoutCompletion: {
        completedAt: new Date('2026-06-27T17:42:00.000Z'),
        completedActivity: {
          distance: 12.4,
          duration: 6120,
          elevationGain: 640,
        },
      },
    },
  });
}

function makeService(
  prisma: PrismaMock,
  mailService: MailServiceMock,
  timeService: TimeServiceMock = makeTimeServiceMock(),
) {
  return new ActivityMailWorkerService(
    prisma as unknown as PrismaService,
    mailService as unknown as MailService,
    timeService as unknown as ActivityMailTimeService,
    config,
  );
}

describe('ActivityMailWorkerService', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-27T13:00:00.000Z'));
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('sends a due upcoming reminder and marks it as sent', async () => {
    const prisma = makePrismaMock();
    const mailService = makeMailServiceMock();
    prisma.scheduledEmail.findMany.mockResolvedValue([makeDueEmail()]);
    prisma.scheduledEmail.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    prisma.scheduledEmail.findUnique.mockResolvedValue(
      makeScheduledEmailWithRelations(),
    );

    await makeService(prisma, mailService).processDueEmails();

    expect(mailService.sendActivityUpcomingReminderEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'camille@example.test',
        activityName: 'Sortie longue',
        activityLocation: 'Annecy, France',
        activityUrl: 'http://localhost:3000/activites/activity-1',
        businessId: 'scheduled-email-1',
      }),
    );
    expect(prisma.scheduledEmail.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'scheduled-email-1' },
        data: expect.objectContaining({
          status: ScheduledEmailStatus.SENT,
          lastError: null,
        }),
      }),
    );
  });

  it('sends completed activity congratulations with completed activity stats', async () => {
    const prisma = makePrismaMock();
    const mailService = makeMailServiceMock();
    prisma.scheduledEmail.findMany.mockResolvedValue([
      makeDueEmail(ScheduledEmailType.ACTIVITY_COMPLETED_CONGRATULATIONS),
    ]);
    prisma.scheduledEmail.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    prisma.scheduledEmail.findUnique.mockResolvedValue(
      makeCompletedScheduledEmail(),
    );

    await makeService(prisma, mailService).processDueEmails();

    expect(
      mailService.sendActivityCompletedCongratulationsEmail,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        distance: '12,4 km',
        duration: '1 h 42',
        elevationGain: '640 m D+',
        businessId: 'scheduled-email-1',
      }),
    );
  });

  it('retries a Resend error with a deterministic delay', async () => {
    const prisma = makePrismaMock();
    const mailService = makeMailServiceMock();
    mailService.sendActivityUpcomingReminderEmail.mockRejectedValue(
      new Error('Transactional email failed with secret token'),
    );
    prisma.scheduledEmail.findMany.mockResolvedValue([makeDueEmail()]);
    prisma.scheduledEmail.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    prisma.scheduledEmail.findUnique.mockResolvedValue(
      makeScheduledEmailWithRelations(),
    );

    await makeService(prisma, mailService).processDueEmails();

    expect(prisma.scheduledEmail.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'scheduled-email-1' },
        data: expect.objectContaining({
          status: ScheduledEmailStatus.PENDING,
          attemptCount: 1,
          scheduledAt: new Date('2026-06-27T13:15:00.000Z'),
        }),
      }),
    );
  });

  it('marks the task as failed after three attempts', async () => {
    const prisma = makePrismaMock();
    const mailService = makeMailServiceMock();
    mailService.sendActivityUpcomingReminderEmail.mockRejectedValue(
      new Error('Transactional email failed'),
    );
    prisma.scheduledEmail.findMany.mockResolvedValue([makeDueEmail()]);
    prisma.scheduledEmail.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    prisma.scheduledEmail.findUnique.mockResolvedValue(
      makeScheduledEmailWithRelations({
        attemptCount: 2,
      }),
    );

    await makeService(prisma, mailService).processDueEmails();

    expect(prisma.scheduledEmail.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ScheduledEmailStatus.FAILED,
          attemptCount: 3,
        }),
      }),
    );
  });

  it('does not send a task claimed by another worker', async () => {
    const prisma = makePrismaMock();
    const mailService = makeMailServiceMock();
    prisma.scheduledEmail.findMany.mockResolvedValue([makeDueEmail()]);
    prisma.scheduledEmail.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 });

    await makeService(prisma, mailService).processDueEmails();

    expect(mailService.sendActivityUpcomingReminderEmail).not.toHaveBeenCalled();
  });

  it('releases stuck processing tasks before selecting due work', async () => {
    const prisma = makePrismaMock();
    const mailService = makeMailServiceMock();
    prisma.scheduledEmail.findMany.mockResolvedValue([]);
    prisma.scheduledEmail.updateMany.mockResolvedValue({ count: 1 });

    await makeService(prisma, mailService).processDueEmails();

    expect(prisma.scheduledEmail.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: ScheduledEmailStatus.PROCESSING,
        }),
        data: expect.objectContaining({
          status: ScheduledEmailStatus.PENDING,
        }),
      }),
    );
  });

  it('cancels the task when the user email is not verified', async () => {
    const prisma = makePrismaMock();
    const mailService = makeMailServiceMock();
    prisma.scheduledEmail.findMany.mockResolvedValue([makeDueEmail()]);
    prisma.scheduledEmail.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    prisma.scheduledEmail.findUnique.mockResolvedValue(
      makeScheduledEmailWithRelations({
        user: {
          id: 'user-1',
          firstName: 'Camille',
          email: 'camille@example.test',
          emailVerifiedAt: null,
        },
      }),
    );

    await makeService(prisma, mailService).processDueEmails();

    expect(mailService.sendActivityUpcomingReminderEmail).not.toHaveBeenCalled();
    expect(prisma.scheduledEmail.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ScheduledEmailStatus.CANCELLED,
          lastError: 'User email is not verified',
        }),
      }),
    );
  });

  it('cancels the reminder when the activity status is incompatible', async () => {
    const prisma = makePrismaMock();
    const mailService = makeMailServiceMock();
    prisma.scheduledEmail.findMany.mockResolvedValue([makeDueEmail()]);
    prisma.scheduledEmail.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    prisma.scheduledEmail.findUnique.mockResolvedValue(
      makeScheduledEmailWithRelations({
        activity: {
          id: 'activity-1',
          title: 'Sortie longue',
          city: 'Annecy',
          country: 'France',
          type: ActivityType.TRAINING,
          sport: SportType.TRAIL,
          status: ActivityStatus.CANCELED,
          distance: 12.4,
          duration: 6120,
          elevationGain: 640,
          startedAt: new Date('2026-06-27T16:00:00.000Z'),
          plannedWorkoutCompletion: null,
        },
      }),
    );

    await makeService(prisma, mailService).processDueEmails();

    expect(mailService.sendActivityUpcomingReminderEmail).not.toHaveBeenCalled();
    expect(prisma.scheduledEmail.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ScheduledEmailStatus.CANCELLED,
        }),
      }),
    );
  });
});
