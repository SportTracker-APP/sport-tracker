import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { SummitsService } from './summits.service';

const BACKGROUND_BATCH_SIZE = 10;

@Injectable()
export class SummitDetectionWorkerService {
  private readonly logger = new Logger(SummitDetectionWorkerService.name);
  private running = false;

  constructor(
    private readonly summitsService: SummitsService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async reconcilePendingDetections(): Promise<void> {
    if (!this.isEnabled() || this.running) {
      return;
    }

    this.running = true;

    try {
      const result =
        await this.summitsService.reconcilePendingActivityDetections({
          batchSize: BACKGROUND_BATCH_SIZE,
          maxBatches: 1,
        });

      if (result.processed > 0) {
        this.logger.log({
          ...result,
          message: 'Background summit detection reconciliation completed',
        });
      }
    } catch (error) {
      this.logger.warn({
        errorName: error instanceof Error ? error.name : 'UnknownError',
        message: 'Background summit detection reconciliation deferred',
      });
    } finally {
      this.running = false;
    }
  }

  private isEnabled(): boolean {
    return (
      this.configService.get<string>('NODE_ENV') === 'production' ||
      this.configService.get<string>('SUMMIT_DETECTION_WORKER_ENABLED') ===
        'true'
    );
  }
}
