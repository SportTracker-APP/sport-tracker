import { NestFactory } from '@nestjs/core';

import { AppModule } from '../../../app.module';
import { SummitsService } from '../summits.service';

async function main(): Promise<void> {
  const application = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const service = application.get(SummitsService);
    const results = await service.recalculateAll();
    const totals = results.reduce(
      (summary, result) => ({
        users: summary.users + 1,
        activities: summary.activities + result.processed,
        discoveries: summary.discoveries + result.detected,
        confirmed: summary.confirmed + result.confirmed,
      }),
      { users: 0, activities: 0, discoveries: 0, confirmed: 0 },
    );

    console.log('Summit recalculation completed', totals);
  } finally {
    await application.close();
  }
}

void main();
