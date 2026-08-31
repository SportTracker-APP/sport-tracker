import { NestFactory } from '@nestjs/core';

import { AppModule } from '../../../app.module';
import { SummitsService } from '../summits.service';

const DEFAULT_BATCH_SIZE = 20;

function getBatchSize(): number {
  const value = Number.parseInt(
    process.env.SUMMIT_DETECTION_BATCH_SIZE ?? '',
    10,
  );

  return Number.isFinite(value) && value > 0 ? value : DEFAULT_BATCH_SIZE;
}

async function main(): Promise<void> {
  const application = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const service = application.get(SummitsService);
    const result = await service.reconcilePendingActivityDetections({
      batchSize: getBatchSize(),
    });

    console.log('Pending summit detection reconciliation completed', result);

    if (result.remaining > 0) {
      process.exitCode = 1;
    }
  } finally {
    await application.close();
  }
}

void main();
