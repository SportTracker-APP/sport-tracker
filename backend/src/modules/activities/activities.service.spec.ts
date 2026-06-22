import { ConflictException, NotFoundException } from '@nestjs/common';
import { ActivityStatus, ActivityType, SportType } from '@prisma/client';

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
  findFirst: jest.Mock;
  update: jest.Mock;
};

type PrismaMock = {
  activity: ActivityDelegateMock;
  $transaction: jest.Mock;
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

function makeService(prisma: PrismaMock) {
  return new ActivitiesService(
    prisma as unknown as PrismaService,
    {} as unknown as StravaService,
  );
}

describe('ActivitiesService planned workout completion', () => {
  it('creates a completed activity and completes the planned workout in one transaction', async () => {
    const plannedWorkout = makeActivity({
      id: 'planned-1',
      status: ActivityStatus.PLANNED,
    });
    const createdActivity = makeActivity({ id: 'activity-1' });
    const completedWorkout = {
      ...plannedWorkout,
      status: ActivityStatus.COMPLETED,
      completedActivityId: createdActivity.id,
      completedAt: new Date('2026-06-20T09:30:00.000Z'),
    };
    const tx: PrismaMock = {
      activity: {
        create: jest.fn().mockResolvedValue(createdActivity),
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(plannedWorkout)
          .mockResolvedValueOnce(createdActivity),
        update: jest
          .fn()
          .mockResolvedValueOnce({ ...createdActivity, plannedWorkoutId: plannedWorkout.id })
          .mockResolvedValueOnce(completedWorkout),
      },
      $transaction: jest.fn(),
    };
    const prisma: PrismaMock = {
      activity: tx.activity,
      $transaction: jest.fn((callback: (client: PrismaMock) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    const result = await makeService(prisma).create('user-1', {
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
        data: expect.objectContaining({
          userId: 'user-1',
          status: ActivityStatus.COMPLETED,
          plannedWorkoutId: plannedWorkout.id,
        }),
      }),
    );
    expect(tx.activity.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: plannedWorkout.id },
        data: expect.objectContaining({
          status: ActivityStatus.COMPLETED,
          completedActivityId: createdActivity.id,
        }),
      }),
    );
    expect(result).toBe(completedWorkout);
  });

  it('refuses completion when the planned workout belongs to another user', async () => {
    const tx: PrismaMock = {
      activity: {
        create: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const prisma: PrismaMock = {
      activity: tx.activity,
      $transaction: jest.fn((callback: (client: PrismaMock) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    await expect(
      makeService(prisma).completePlannedWorkout('user-1', 'planned-1', {
        activityId: 'activity-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.activity.update).not.toHaveBeenCalled();
  });

  it('refuses a second completion', async () => {
    const tx: PrismaMock = {
      activity: {
        create: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(
          makeActivity({
            id: 'planned-1',
            status: ActivityStatus.COMPLETED,
            completedActivityId: 'activity-1',
          }),
        ),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const prisma: PrismaMock = {
      activity: tx.activity,
      $transaction: jest.fn((callback: (client: PrismaMock) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    await expect(
      makeService(prisma).completePlannedWorkout('user-1', 'planned-1', {
        activityId: 'activity-2',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.activity.update).not.toHaveBeenCalled();
  });

  it('lets the transaction reject when linking fails after activity creation', async () => {
    const tx: PrismaMock = {
      activity: {
        create: jest.fn().mockResolvedValue(makeActivity({ id: 'activity-1' })),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const prisma: PrismaMock = {
      activity: tx.activity,
      $transaction: jest.fn((callback: (client: PrismaMock) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    await expect(
      makeService(prisma).create('user-1', {
        type: ActivityTypeDto.TRAINING,
        sport: SportTypeDto.TRAIL,
        status: ActivityStatusDto.COMPLETED,
        title: 'Sortie longue réalisée',
        duration: 95,
        startedAt: '2026-06-20T08:00:00.000Z',
        plannedWorkoutId: 'planned-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.activity.create).toHaveBeenCalledTimes(1);
    expect(tx.activity.update).not.toHaveBeenCalled();
  });

  it('persists the celebration hide state', async () => {
    const plannedWorkout = makeActivity({
      id: 'planned-1',
      status: ActivityStatus.COMPLETED,
      completedActivityId: 'activity-1',
    });
    const prisma: PrismaMock = {
      activity: {
        create: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(plannedWorkout),
        update: jest.fn().mockResolvedValue({
          ...plannedWorkout,
          celebrationSeenAt: new Date('2026-06-20T10:00:00.000Z'),
        }),
      },
      $transaction: jest.fn(),
    };

    await makeService(prisma).markCelebrationSeen('user-1', plannedWorkout.id);

    expect(prisma.activity.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: plannedWorkout.id },
        data: expect.objectContaining({
          celebrationSeenAt: expect.any(Date) as Date,
        }),
      }),
    );
  });
});
