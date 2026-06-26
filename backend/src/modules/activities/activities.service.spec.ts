import { ConflictException, NotFoundException } from '@nestjs/common';
import { ActivityStatus, ActivityType, SportType } from '@prisma/client';

import { ActivityMailSchedulerService } from '../../mail/scheduling/activity-mail-scheduler.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StravaService } from '../strava/strava.service';

import { ActivitiesService } from './activities.service';
import {
  ActivityStatus as ActivityStatusDto,
  ActivityType as ActivityTypeDto,
  SportType as SportTypeDto,
} from './dto/create-activity.dto';

type ActivityMock = {
  id: string;
  userId: string;
  title: string | null;
  type: ActivityType;
  sport: SportType;
  status: ActivityStatus;
  duration: number;
  startedAt: Date;
  plannedWorkoutId: string | null;
  completedActivityId: string | null;
  completedAt: Date | null;
  celebrationSeenAt: Date | null;
};

type ActivityDelegateMock = {
  create: jest.Mock;
  delete: jest.Mock;
  findFirst: jest.Mock;
  findMany: jest.Mock;
  update: jest.Mock;
};

type PlannedWorkoutCompletionDelegateMock = {
  create: jest.Mock;
  findFirst: jest.Mock;
  findMany: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
};

type PrismaMock = {
  activity: ActivityDelegateMock;
  plannedWorkoutCompletion: PlannedWorkoutCompletionDelegateMock;
  $transaction: jest.Mock;
};

type ActivityMailSchedulerMock = {
  scheduleUpcomingActivityReminder: jest.Mock;
  rescheduleUpcomingActivityReminder: jest.Mock;
  cancelUpcomingActivityReminder: jest.Mock;
  scheduleCompletedActivityCongratulations: jest.Mock;
};

function makeActivity(overrides: Partial<ActivityMock> = {}): ActivityMock {
  return {
    id: 'activity-1',
    userId: 'user-1',
    title: 'Sortie longue',
    type: ActivityType.TRAINING,
    sport: SportType.TRAIL,
    status: ActivityStatus.COMPLETED,
    duration: 75,
    startedAt: new Date('2026-06-20T08:00:00.000Z'),
    plannedWorkoutId: null,
    completedActivityId: null,
    completedAt: null,
    celebrationSeenAt: null,
    ...overrides,
  };
}

function makePrismaMock(): PrismaMock {
  return {
    activity: {
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    plannedWorkoutCompletion: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

function makeSchedulerMock(): ActivityMailSchedulerMock {
  return {
    scheduleUpcomingActivityReminder: jest.fn().mockResolvedValue(undefined),
    rescheduleUpcomingActivityReminder: jest.fn().mockResolvedValue(undefined),
    cancelUpcomingActivityReminder: jest.fn().mockResolvedValue(undefined),
    scheduleCompletedActivityCongratulations: jest.fn().mockResolvedValue(undefined),
  };
}

function makeService(
  prisma: PrismaMock,
  scheduler: ActivityMailSchedulerMock = makeSchedulerMock(),
) {
  return new ActivitiesService(
    prisma as unknown as PrismaService,
    {} as unknown as StravaService,
    scheduler as unknown as ActivityMailSchedulerService,
  );
}

describe('ActivitiesService planned workout completion', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-20T09:30:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a completed activity, completes the planned workout and schedules congratulations', async () => {
    const plannedWorkout = makeActivity({
      id: 'planned-1',
      status: ActivityStatus.PLANNED,
    });
    const createdActivity = makeActivity({ id: 'activity-1' });
    const completedAt = new Date('2026-06-20T09:30:00.000Z');
    const completedWorkout = {
      ...plannedWorkout,
      status: ActivityStatus.COMPLETED,
    };
    const scheduler = makeSchedulerMock();
    const tx = makePrismaMock();
    tx.activity.create.mockResolvedValue(createdActivity);
    tx.activity.findFirst
      .mockResolvedValueOnce(plannedWorkout)
      .mockResolvedValueOnce(createdActivity);
    tx.plannedWorkoutCompletion.findFirst.mockResolvedValue(null);
    tx.plannedWorkoutCompletion.create.mockResolvedValue({
      plannedWorkoutId: plannedWorkout.id,
      completedActivityId: createdActivity.id,
      completedAt,
      celebrationSeenAt: null,
      plannedWorkout: null,
      completedActivity: createdActivity,
    });
    tx.activity.update.mockResolvedValue(completedWorkout);

    const prisma = makePrismaMock();
    prisma.activity = tx.activity;
    prisma.plannedWorkoutCompletion = tx.plannedWorkoutCompletion;
    prisma.$transaction.mockImplementation(
      (callback: (client: PrismaMock) => Promise<unknown>) => callback(tx),
    );

    const result = await makeService(prisma, scheduler).create('user-1', {
      type: ActivityTypeDto.TRAINING,
      sport: SportTypeDto.TRAIL,
      status: ActivityStatusDto.COMPLETED,
      title: 'Sortie longue réalisée',
      distance: 18,
      duration: 95,
      elevationGain: 650,
      startedAt: '2026-06-20T08:00:00.000Z',
      plannedWorkoutId: plannedWorkout.id,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          plannedWorkoutId: plannedWorkout.id,
        }),
      }),
    );
    expect(tx.activity.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: plannedWorkout.id },
        data: {
          status: ActivityStatus.COMPLETED,
        },
      }),
    );
    expect(scheduler.cancelUpcomingActivityReminder).toHaveBeenCalledWith(
      plannedWorkout.id,
    );
    expect(
      scheduler.scheduleCompletedActivityCongratulations,
    ).toHaveBeenCalledWith({
      activityId: plannedWorkout.id,
      completedAt,
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: plannedWorkout.id,
        completedActivityId: createdActivity.id,
        completedAt,
      }),
    );
  });

  it('schedules an upcoming reminder when a planned activity is created', async () => {
    const prisma = makePrismaMock();
    const scheduler = makeSchedulerMock();
    const plannedActivity = makeActivity({
      id: 'planned-1',
      status: ActivityStatus.PLANNED,
    });
    prisma.activity.create.mockResolvedValue(plannedActivity);

    await makeService(prisma, scheduler).create('user-1', {
      type: ActivityTypeDto.TRAINING,
      sport: SportTypeDto.TRAIL,
      status: ActivityStatusDto.PLANNED,
      title: 'Footing',
      duration: 45,
      startedAt: '2026-06-20T08:00:00.000Z',
    });

    expect(scheduler.scheduleUpcomingActivityReminder).toHaveBeenCalledWith(
      plannedActivity.id,
    );
  });

  it('reschedules an upcoming reminder when a planned activity is updated', async () => {
    const prisma = makePrismaMock();
    const scheduler = makeSchedulerMock();
    const plannedActivity = makeActivity({
      id: 'planned-1',
      status: ActivityStatus.PLANNED,
    });
    prisma.activity.findFirst.mockResolvedValue(plannedActivity);
    prisma.activity.update.mockResolvedValue({
      ...plannedActivity,
      startedAt: new Date('2026-06-21T09:00:00.000Z'),
    });

    await makeService(prisma, scheduler).update('user-1', plannedActivity.id, {
      startedAt: '2026-06-21T09:00:00.000Z',
    });

    expect(scheduler.rescheduleUpcomingActivityReminder).toHaveBeenCalledWith(
      plannedActivity.id,
    );
  });

  it('cancels an upcoming reminder when a planned activity is deleted', async () => {
    const prisma = makePrismaMock();
    const scheduler = makeSchedulerMock();
    const plannedActivity = makeActivity({
      id: 'planned-1',
      status: ActivityStatus.PLANNED,
    });
    prisma.activity.findFirst.mockResolvedValue(plannedActivity);
    prisma.activity.delete.mockResolvedValue(plannedActivity);

    await makeService(prisma, scheduler).remove('user-1', plannedActivity.id);

    expect(scheduler.cancelUpcomingActivityReminder).toHaveBeenCalledWith(
      plannedActivity.id,
    );
    expect(prisma.activity.delete).toHaveBeenCalledWith({
      where: {
        id: plannedActivity.id,
      },
    });
  });

  it('refuses completion when the planned workout belongs to another user', async () => {
    const tx = makePrismaMock();
    tx.activity.findFirst.mockResolvedValue(null);
    const prisma = makePrismaMock();
    prisma.$transaction.mockImplementation(
      (callback: (client: PrismaMock) => Promise<unknown>) => callback(tx),
    );

    await expect(
      makeService(prisma).completePlannedWorkout('user-1', 'planned-1', {
        activityId: 'activity-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.activity.update).not.toHaveBeenCalled();
  });

  it('refuses a second completion', async () => {
    const tx = makePrismaMock();
    tx.activity.findFirst.mockResolvedValue(
      makeActivity({
        id: 'planned-1',
        status: ActivityStatus.COMPLETED,
        completedActivityId: 'activity-1',
      }),
    );
    const prisma = makePrismaMock();
    prisma.$transaction.mockImplementation(
      (callback: (client: PrismaMock) => Promise<unknown>) => callback(tx),
    );

    await expect(
      makeService(prisma).completePlannedWorkout('user-1', 'planned-1', {
        activityId: 'activity-2',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.activity.update).not.toHaveBeenCalled();
  });

  it('persists the celebration hide state', async () => {
    const plannedWorkout = makeActivity({
      id: 'planned-1',
      status: ActivityStatus.COMPLETED,
      completedActivityId: 'activity-1',
    });
    const prisma = makePrismaMock();
    prisma.activity.findFirst.mockResolvedValue(plannedWorkout);
    prisma.plannedWorkoutCompletion.findUnique.mockResolvedValue({
      plannedWorkoutId: plannedWorkout.id,
    });
    prisma.plannedWorkoutCompletion.update.mockResolvedValue({
      ...plannedWorkout,
      celebrationSeenAt: new Date('2026-06-20T10:00:00.000Z'),
    });

    await makeService(prisma).markCelebrationSeen('user-1', plannedWorkout.id);

    const updatePayload = prisma.plannedWorkoutCompletion.update.mock
      .calls[0]?.[0] as {
      where: { plannedWorkoutId: string };
      data: { celebrationSeenAt: Date };
    };

    expect(updatePayload.where).toEqual({ plannedWorkoutId: plannedWorkout.id });
    expect(updatePayload.data.celebrationSeenAt).toBeInstanceOf(Date);
  });
});
