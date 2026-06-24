import { NestFactory } from '@nestjs/core';

import { AppModule } from '../../app.module';
import { MAIL_CONFIG } from '../mail.constants';
import { MailService } from '../mail.service';
import { MailConfig } from '../mail.types';

async function runSmokeTest() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Mail smoke test cannot run in production');
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const config = app.get<MailConfig>(MAIL_CONFIG);

    if (!config.testRecipient) {
      throw new Error('MAIL_TEST_RECIPIENT is required for mail smoke test');
    }

    const mailService = app.get(MailService);

    await mailService.sendWelcomeEmail({
      to: config.testRecipient,
      userName: 'Camille',
      businessId: `local-smoke-${Date.now()}`,
    });
  } finally {
    await app.close();
  }
}

void runSmokeTest();
