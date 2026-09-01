import {
  ActivityStatus,
  ActivityType,
  ScheduledEmailStatus,
  ScheduledEmailType,
  SportType,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ActivityMailSchedulerService } from '../scheduling/activity-mail-scheduler.service';
import { ActivityMailTimeService } from '../scheduling/activity-mail-time.service';

type PrismaMock = {
  activity: {
    findUnique: jest.Mock;
  };
  scheduledEmail: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
};

type TimeServiceMock = {
  calculateUpcomingReminderAt: jest.Mock;
  calculateCompletedCongratulationsAt: jest.Mock;
  getDefaultTimezone: jest.Mock;
};

function makeActivity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'activity-1',
    userId: 'user-1',
    title: 'Sortie longue',
    type: ActivityType.TRAINING,
    sport: SportType.TRAIL,
    status: ActivityStatus.PLANNED,
    duration: 3600,
    startedAt: new Date('2026-06-27T16:00:00.000Z'),
    user: {
      id: 'user-1',
      emailVerifiedAt: new Date('2026-06-20T08:00:00.000Z'),
    },
    ...overrides,
  };
}

function makePrismaMock(): PrismaMock {
  return {
    activity: {
      findUnique: jest.fn(),
    },
    scheduledEmail: {
      create: jest.fn().mockResolvedValue(undefined),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(undefined),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

function makeTimeServiceMock(): TimeServiceMock {
  return {
    calculateUpcomingReminderAt: jest
      .fn()
      .mockReturnValue(new Date('2026-06-27T13:00:00.000Z')),
    calculateCompletedCongratulationsAt: jest
      .fn()
      .mockReturnValue(new Date('2026-06-28T07:00:00.000Z')),
    getDefaultTimezone: jest.fn().mockReturnValue('Europe/Paris'),
  };
}

function makeService(prisma: PrismaMock, timeService: TimeServiceMock) {
  return new ActivityMailSchedulerService(
    prisma as unknown as PrismaService,
    timeService as unknown as ActivityMailTimeService,
  );
}

describe('ActivityMailSchedulerService', () => {
  it('creates an upcoming reminder for a verified user and planned activity', async () => {
    const prisma = makePrismaMock();
    const timeService = makeTimeServiceMock();
    prisma.activity.findUnique.mockResolvedValue(makeActivity());

    await makeService(prisma, timeService).scheduleUpcomingActivityReminder(
      'activity-1',
      new Date('2026-06-27T08:00:00.000Z'),
    );

    expect(prisma.scheduledEmail.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        activityId: 'activity-1',
        type: ScheduledEmailType.ACTIVITY_UPCOMING_REMINDER,
        scheduledAt: new Date('2026-06-27T13:00:00.000Z'),
      },
    });
  });

  it('does not duplicate an already sent upcoming reminder', async () => {
    const prisma = makePrismaMock();
    const timeService = makeTimeServiceMock();
    prisma.activity.findUnique.mockResolvedValue(makeActivity());
    prisma.scheduledEmail.findUnique.mockResolvedValue({
      id: 'scheduled-email-1',
      status: ScheduledEmailStatus.SENT,
    });

    await makeService(prisma, timeService).scheduleUpcomingActivityReminder(
      'activity-1',
    );

    expect(prisma.scheduledEmail.create).not.toHaveBeenCalled();
    expect(prisma.scheduledEmail.update).not.toHaveBeenCalled();
  });

  it('cancels the reminder when the user email is not verified', async () => {
    const prisma = makePrismaMock();
    const timeService = makeTimeServiceMock();
    prisma.activity.findUnique.mockResolvedValue(
      makeActivity({
        user: {
          id: 'user-1',
          emailVerifiedAt: null,
        },
      }),
    );

    await makeService(prisma, timeService).scheduleUpcomingActivityReminder(
      'activity-1',
    );

    expect(prisma.scheduledEmail.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          activityId: 'activity-1',
          type: ScheduledEmailType.ACTIVITY_UPCOMING_REMINDER,
        }),
        data: expect.objectContaining({
          status: ScheduledEmailStatus.CANCELLED,
        }),
      }),
    );
  });

  it('updates an existing pending reminder when the activity date changes', async () => {
    const prisma = makePrismaMock();
    const timeService = makeTimeServiceMock();
    prisma.activity.findUnique.mockResolvedValue(makeActivity());
    prisma.scheduledEmail.findUnique.mockResolvedValue({
      id: 'scheduled-email-1',
      status: ScheduledEmailStatus.PENDING,
    });

    await makeService(prisma, timeService).rescheduleUpcomingActivityReminder(
      'activity-1',
    );

    expect(prisma.scheduledEmail.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'scheduled-email-1',
        },
        data: expect.objectContaining({
          status: ScheduledEmailStatus.PENDING,
          scheduledAt: new Date('2026-06-27T13:00:00.000Z'),
        }),
      }),
    );
  });

  it('creates completed activity congratulations once for a recent completed activity', async () => {
    const prisma = makePrismaMock();
    const timeService = makeTimeServiceMock();
    prisma.activity.findUnique.mockResolvedValue(
      makeActivity({
        status: ActivityStatus.COMPLETED,
      }),
    );

    await makeService(
      prisma,
      timeService,
    ).scheduleCompletedActivityCongratulations({
      activityId: 'activity-1',
      completedAt: new Date('2026-06-27T16:00:00.000Z'),
    });

    expect(prisma.scheduledEmail.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        activityId: 'activity-1',
        type: ScheduledEmailType.ACTIVITY_COMPLETED_CONGRATULATIONS,
        scheduledAt: new Date('2026-06-28T07:00:00.000Z'),
      },
    });
  });

  it('does not create congratulations for an activity that is not completed', async () => {
    const prisma = makePrismaMock();
    const timeService = makeTimeServiceMock();
    prisma.activity.findUnique.mockResolvedValue(makeActivity());

    await makeService(
      prisma,
      timeService,
    ).scheduleCompletedActivityCongratulations({
      activityId: 'activity-1',
      completedAt: new Date('2026-06-27T16:00:00.000Z'),
    });

    expect(prisma.scheduledEmail.create).not.toHaveBeenCalled();
  });

  it('does not create congratulations for an old historical import', async () => {
    const prisma = makePrismaMock();
    const timeService = makeTimeServiceMock();
    timeService.calculateCompletedCongratulationsAt.mockReturnValue(null);
    prisma.activity.findUnique.mockResolvedValue(
      makeActivity({
        status: ActivityStatus.COMPLETED,
      }),
    );

    await makeService(
      prisma,
      timeService,
    ).scheduleCompletedActivityCongratulations({
      activityId: 'activity-1',
      completedAt: new Date('2026-06-20T16:00:00.000Z'),
    });

    expect(prisma.scheduledEmail.create).not.toHaveBeenCalled();
  });
});
