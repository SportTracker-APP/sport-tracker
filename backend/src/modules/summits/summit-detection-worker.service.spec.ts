import { ConfigService } from '@nestjs/config';

import { SummitDetectionWorkerService } from './summit-detection-worker.service';
import { SummitsService } from './summits.service';

function makeWorker(
  reconcilePendingActivityDetections: jest.Mock,
  environment = 'production',
  workerEnabled = true,
) {
  return new SummitDetectionWorkerService(
    { reconcilePendingActivityDetections } as unknown as SummitsService,
    {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return environment;
        if (key === 'SUMMIT_DETECTION_WORKER_ENABLED') {
          return workerEnabled ? 'true' : undefined;
        }
        return undefined;
      }),
    } as unknown as ConfigService,
  );
}

describe('SummitDetectionWorkerService', () => {
  it('processes at most one small batch per scheduled run', async () => {
    const reconcilePendingActivityDetections = jest.fn().mockResolvedValue({
      batches: 1,
      processed: 10,
      detected: 2,
      confirmed: 1,
      remaining: 100,
    });
    const worker = makeWorker(reconcilePendingActivityDetections);

    await worker.reconcilePendingDetections();

    expect(reconcilePendingActivityDetections).toHaveBeenCalledWith({
      batchSize: 10,
      maxBatches: 1,
    });
  });

  it('does not overlap scheduled reconciliation runs', async () => {
    let release: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const reconcilePendingActivityDetections = jest
      .fn()
      .mockImplementation(async () => {
        await pending;
        return {
          batches: 0,
          processed: 0,
          detected: 0,
          confirmed: 0,
          remaining: 0,
        };
      });
    const worker = makeWorker(reconcilePendingActivityDetections);

    const firstRun = worker.reconcilePendingDetections();
    await worker.reconcilePendingDetections();
    release?.();
    await firstRun;

    expect(reconcilePendingActivityDetections).toHaveBeenCalledTimes(1);
  });

  it('does not touch the database when the worker is not explicitly enabled', async () => {
    const reconcilePendingActivityDetections = jest.fn();
    const worker = makeWorker(
      reconcilePendingActivityDetections,
      'production',
      false,
    );

    await worker.reconcilePendingDetections();

    expect(reconcilePendingActivityDetections).not.toHaveBeenCalled();
  });
});
