import { ActivityStatus, SportType } from '@prisma/client';

import { ActivityMailSchedulerService } from '../../mail/scheduling/activity-mail-scheduler.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PlannedWorkoutReconciliationService } from './planned-workout-reconciliation.service';

function createService() {
  const tx = {
    activity: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    plannedWorkoutCompletion: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };
  const prisma = {
    $transaction: jest.fn(
      async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    ),
  } as unknown as PrismaService;
  const cancelUpcomingActivityReminder = jest.fn().mockResolvedValue(undefined);
  const mailScheduler = {
    cancelUpcomingActivityReminder,
    scheduleCompletedActivityCongratulations: jest
      .fn()
      .mockResolvedValue(undefined),
  } as unknown as ActivityMailSchedulerService;

  return {
    service: new PlannedWorkoutReconciliationService(prisma, mailScheduler),
    tx,
    mailScheduler,
    cancelUpcomingActivityReminder,
  };
}

describe('PlannedWorkoutReconciliationService', () => {
  it('links one unambiguous Strava activity to its planned workout', async () => {
    const { service, tx, cancelUpcomingActivityReminder } = createService();

    tx.activity.findFirst.mockResolvedValue({
      id: 'strava-activity',
      sport: SportType.MTB,
      startedAt: new Date('2026-09-01T15:54:00.000Z'),
    });
    tx.plannedWorkoutCompletion.findUnique.mockResolvedValue(null);
    tx.activity.findMany.mockResolvedValue([{ id: 'planned-workout' }]);
    tx.plannedWorkoutCompletion.findMany.mockResolvedValue([]);
    tx.plannedWorkoutCompletion.create.mockResolvedValue({
      id: 'completion',
    });
    tx.activity.update.mockResolvedValue({
      id: 'planned-workout',
      status: ActivityStatus.COMPLETED,
    });

    await expect(
      service.reconcileStravaActivities('user-1', ['strava-activity']),
    ).resolves.toEqual({ matched: 1, skippedAmbiguous: 0 });
    expect(tx.plannedWorkoutCompletion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        plannedWorkoutId: 'planned-workout',
        completedActivityId: 'strava-activity',
      }),
    });
    expect(tx.activity.update).toHaveBeenCalledWith({
      where: { id: 'planned-workout' },
      data: { status: ActivityStatus.COMPLETED },
    });
    expect(cancelUpcomingActivityReminder).toHaveBeenCalledWith(
      'planned-workout',
    );
  });

  it('does not guess when several planned workouts could match', async () => {
    const { service, tx } = createService();

    tx.activity.findFirst.mockResolvedValue({
      id: 'strava-activity',
      sport: SportType.MTB,
      startedAt: new Date('2026-09-01T15:54:00.000Z'),
    });
    tx.plannedWorkoutCompletion.findUnique.mockResolvedValue(null);
    tx.activity.findMany.mockResolvedValue([
      { id: 'planned-workout-1' },
      { id: 'planned-workout-2' },
    ]);
    tx.plannedWorkoutCompletion.findMany.mockResolvedValue([]);

    await expect(
      service.reconcileStravaActivities('user-1', ['strava-activity']),
    ).resolves.toEqual({ matched: 0, skippedAmbiguous: 1 });
    expect(tx.plannedWorkoutCompletion.create).not.toHaveBeenCalled();
    expect(tx.activity.update).not.toHaveBeenCalled();
  });

  it('leaves an activity already linked unchanged', async () => {
    const { service, tx } = createService();

    tx.activity.findFirst.mockResolvedValue({
      id: 'strava-activity',
      sport: SportType.MTB,
      startedAt: new Date('2026-09-01T15:54:00.000Z'),
    });
    tx.plannedWorkoutCompletion.findUnique.mockResolvedValue({
      id: 'completion',
    });

    await expect(
      service.reconcileStravaActivities('user-1', ['strava-activity']),
    ).resolves.toEqual({ matched: 0, skippedAmbiguous: 0 });
    expect(tx.activity.findMany).not.toHaveBeenCalled();
    expect(tx.plannedWorkoutCompletion.create).not.toHaveBeenCalled();
  });
});
