import { z } from 'zod';

import { MAIL_TEMPLATE_DEFAULTS } from './mail.constants';
import type { MailConfig } from './mail.types';

export type MailEnvValues = {
  RESEND_API_KEY?: string;
  MAIL_ENABLED?: string;
  MAIL_FROM?: string;
  MAIL_REPLY_TO?: string;
  MAIL_TEST_RECIPIENT?: string;
  APP_BASE_URL?: string;
  FRONTEND_URL?: string;
  APP_DEFAULT_TIMEZONE?: string;
  RESEND_TEMPLATE_AUTH_VERIFY?: string;
  RESEND_TEMPLATE_AUTH_WELCOME?: string;
  RESEND_TEMPLATE_AUTH_RESET_PASSWORD?: string;
  RESEND_TEMPLATE_AUTH_PASSWORD_CHANGED?: string;
  RESEND_TEMPLATE_ACTIVITY_FIRST_CREATED?: string;
  RESEND_ACTIVITY_UPCOMING_REMINDER_TEMPLATE_ID?: string;
  RESEND_ACTIVITY_COMPLETED_TEMPLATE_ID?: string;
  RESEND_TEMPLATE_SUMMIT_FIRST_VALIDATED?: string;
};

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
      .default('HOVREN - Ton carnet outdoor <noreply@hovren.fr>'),
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

export function createMailConfigFromEnv(values: MailEnvValues): MailConfig {
  const parsed = mailEnvSchema.parse(values);

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
}
