import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { z } from 'zod';

import {
  MAIL_CONFIG,
  MAIL_PROVIDER,
  MAIL_TEMPLATE_DEFAULTS,
  RESEND_CLIENT,
} from './mail.constants';
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

function emptyStringToUndefined(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

const mailEnvSchema = z
  .object({
    RESEND_API_KEY: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1).optional(),
    ),
    MAIL_ENABLED: z
      .preprocess(
        emptyStringToUndefined,
        z.enum(['true', 'false']).default('false'),
      )
      .default('false')
      .transform((value) => value === 'true'),
    MAIL_FROM: z
      .string()
      .trim()
      .min(1)
      .default('Hovren <onboarding@resend.dev>'),
    MAIL_REPLY_TO: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().optional(),
    ),
    MAIL_TEST_RECIPIENT: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().email().optional(),
    ),
    APP_BASE_URL: z.string().trim().url().default('http://localhost:3000'),
    FRONTEND_URL: z.string().trim().url().default('http://localhost:3000'),
    APP_DEFAULT_TIMEZONE: z
      .string()
      .trim()
      .min(1)
      .default('Europe/Paris'),
    RESEND_TEMPLATE_AUTH_VERIFY: z
      .string()
      .trim()
      .min(1)
      .default(MAIL_TEMPLATE_DEFAULTS.authVerify),
    RESEND_TEMPLATE_AUTH_WELCOME: z
      .string()
      .trim()
      .min(1)
      .default(MAIL_TEMPLATE_DEFAULTS.authWelcome),
    RESEND_TEMPLATE_AUTH_RESET_PASSWORD: z
      .string()
      .trim()
      .min(1)
      .default(MAIL_TEMPLATE_DEFAULTS.authResetPassword),
    RESEND_TEMPLATE_AUTH_PASSWORD_CHANGED: z
      .string()
      .trim()
      .min(1)
      .default(MAIL_TEMPLATE_DEFAULTS.authPasswordChanged),
    RESEND_TEMPLATE_ACTIVITY_FIRST_CREATED: z
      .string()
      .trim()
      .min(1)
      .default(MAIL_TEMPLATE_DEFAULTS.activityFirstCreated),
    RESEND_ACTIVITY_UPCOMING_REMINDER_TEMPLATE_ID: z
      .string()
      .trim()
      .min(1)
      .default(MAIL_TEMPLATE_DEFAULTS.activityUpcomingReminder),
    RESEND_ACTIVITY_COMPLETED_TEMPLATE_ID: z
      .string()
      .trim()
      .min(1)
      .default(MAIL_TEMPLATE_DEFAULTS.activityCompletedCongratulations),
    RESEND_TEMPLATE_SUMMIT_FIRST_VALIDATED: z
      .string()
      .trim()
      .min(1)
      .default(MAIL_TEMPLATE_DEFAULTS.summitFirstValidated),
  })
  .superRefine((value, context) => {
    if (value.MAIL_ENABLED && !value.RESEND_API_KEY) {
      context.addIssue({
        code: 'custom',
        path: ['RESEND_API_KEY'],
        message: 'RESEND_API_KEY is required when MAIL_ENABLED=true',
      });
    }
  });

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    {
      provide: MAIL_CONFIG,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): MailConfig => {
        const parsed = mailEnvSchema.parse({
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

        return {
          enabled: parsed.MAIL_ENABLED,
          apiKey: parsed.RESEND_API_KEY,
          from: parsed.MAIL_FROM,
          replyTo: parsed.MAIL_REPLY_TO,
          testRecipient: parsed.MAIL_TEST_RECIPIENT,
          appBaseUrl: parsed.FRONTEND_URL || parsed.APP_BASE_URL,
          defaultTimezone: parsed.APP_DEFAULT_TIMEZONE,
          templates: {
            authVerify: parsed.RESEND_TEMPLATE_AUTH_VERIFY,
            authWelcome: parsed.RESEND_TEMPLATE_AUTH_WELCOME,
            authResetPassword: parsed.RESEND_TEMPLATE_AUTH_RESET_PASSWORD,
            authPasswordChanged: parsed.RESEND_TEMPLATE_AUTH_PASSWORD_CHANGED,
            activityFirstCreated: parsed.RESEND_TEMPLATE_ACTIVITY_FIRST_CREATED,
            activityUpcomingReminder:
              parsed.RESEND_ACTIVITY_UPCOMING_REMINDER_TEMPLATE_ID,
            activityCompletedCongratulations:
              parsed.RESEND_ACTIVITY_COMPLETED_TEMPLATE_ID,
            summitFirstValidated: parsed.RESEND_TEMPLATE_SUMMIT_FIRST_VALIDATED,
          },
        };
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
