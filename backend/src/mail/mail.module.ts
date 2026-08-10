import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { MAIL_CONFIG, MAIL_PROVIDER, RESEND_CLIENT } from './mail.constants';
import { createMailConfigFromEnv } from './mail.config';
import { ActivityMailSchedulerService } from './scheduling/activity-mail-scheduler.service';
import { ActivityMailTimeService } from './scheduling/activity-mail-time.service';
import { ActivityMailWorkerService } from './scheduling/activity-mail-worker.service';
import { MailService } from './mail.service';
import { MailTemplateRenderer } from './mail-template.renderer';
import { MailConfig } from './mail.types';
import { PrismaModule } from '../prisma/prisma.module';
import {
  createResendClient,
  ResendMailProvider,
} from './providers/resend-mail.provider';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    {
      provide: MAIL_CONFIG,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): MailConfig => {
        return createMailConfigFromEnv({
          RESEND_API_KEY: configService.get<string>('RESEND_API_KEY'),
          MAIL_ENABLED: configService.get<string>('MAIL_ENABLED'),
          MAIL_FROM: configService.get<string>('MAIL_FROM'),
          MAIL_REPLY_TO: configService.get<string>('MAIL_REPLY_TO'),
          MAIL_TEST_RECIPIENT: configService.get<string>('MAIL_TEST_RECIPIENT'),
          APP_BASE_URL: configService.get<string>('APP_BASE_URL'),
          FRONTEND_URL: configService.get<string>('FRONTEND_URL'),
          APP_DEFAULT_TIMEZONE: configService.get<string>(
            'APP_DEFAULT_TIMEZONE',
          ),
        });
      },
    },
    {
      provide: RESEND_CLIENT,
      inject: [MAIL_CONFIG],
      useFactory: (config: MailConfig) => createResendClient(config),
    },
    {
      provide: MAIL_PROVIDER,
      useClass: ResendMailProvider,
    },
    MailService,
    MailTemplateRenderer,
    ActivityMailTimeService,
    ActivityMailSchedulerService,
    ActivityMailWorkerService,
  ],
  exports: [MailService, ActivityMailSchedulerService],
})
export class MailModule {}
