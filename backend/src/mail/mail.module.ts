import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { z } from 'zod';

import {
  MAIL_CONFIG,
  MAIL_PROVIDER,
  MAIL_TEMPLATE_DEFAULTS,
  RESEND_CLIENT,
} from './mail.constants';
import { MailService } from './mail.service';
import { MailConfig } from './mail.types';
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
      .default('Votre carnet outdoor <onboarding@resend.dev>'),
    MAIL_REPLY_TO: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().optional(),
    ),
    MAIL_TEST_RECIPIENT: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().email().optional(),
    ),
    APP_BASE_URL: z.string().trim().url().default('http://localhost:3000'),
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
  imports: [ConfigModule],
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
          appBaseUrl: parsed.APP_BASE_URL,
          templates: {
            authVerify: parsed.RESEND_TEMPLATE_AUTH_VERIFY,
            authWelcome: parsed.RESEND_TEMPLATE_AUTH_WELCOME,
            authResetPassword: parsed.RESEND_TEMPLATE_AUTH_RESET_PASSWORD,
            authPasswordChanged: parsed.RESEND_TEMPLATE_AUTH_PASSWORD_CHANGED,
            activityFirstCreated: parsed.RESEND_TEMPLATE_ACTIVITY_FIRST_CREATED,
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
  ],
  exports: [MailService],
})
export class MailModule {}
