import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import {
  MAIL_CONFIG,
  MAIL_PROVIDER,
  RESEND_CLIENT,
} from './mail.constants';
import { createMailConfigFromEnv } from './mail.config';
import { ActivityMailSchedulerService } from './scheduling/activity-mail-scheduler.service';
import { ActivityMailTimeService } from './scheduling/activity-mail-time.service';
import { ActivityMailWorkerService } from './scheduling/activity-mail-worker.service';
import { MailService } from './mail.service';
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
          APP_DEFAULT_TIMEZONE: configService.get<string>('APP_DEFAULT_TIMEZONE'),
          RESEND_TEMPLATE_AUTH_VERIFY: configService.get<string>(
            'RESEND_TEMPLATE_AUTH_VERIFY',
          ),
          RESEND_TEMPLATE_AUTH_WELCOME: configService.get<string>(
            'RESEND_TEMPLATE_AUTH_WELCOME',
          ),
          RESEND_TEMPLATE_AUTH_RESET_PASSWORD: configService.get<string>(
            'RESEND_TEMPLATE_AUTH_RESET_PASSWORD',
          ),
          RESEND_TEMPLATE_AUTH_PASSWORD_CHANGED: configService.get<string>(
            'RESEND_TEMPLATE_AUTH_PASSWORD_CHANGED',
          ),
          RESEND_TEMPLATE_ACTIVITY_FIRST_CREATED: configService.get<string>(
            'RESEND_TEMPLATE_ACTIVITY_FIRST_CREATED',
          ),
          RESEND_ACTIVITY_UPCOMING_REMINDER_TEMPLATE_ID:
            configService.get<string>(
              'RESEND_ACTIVITY_UPCOMING_REMINDER_TEMPLATE_ID',
            ),
          RESEND_ACTIVITY_COMPLETED_TEMPLATE_ID: configService.get<string>(
            'RESEND_ACTIVITY_COMPLETED_TEMPLATE_ID',
          ),
          RESEND_TEMPLATE_SUMMIT_FIRST_VALIDATED: configService.get<string>(
            'RESEND_TEMPLATE_SUMMIT_FIRST_VALIDATED',
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
    ActivityMailTimeService,
    ActivityMailSchedulerService,
    ActivityMailWorkerService,
  ],
  exports: [MailService, ActivityMailSchedulerService],
})
export class MailModule {}
