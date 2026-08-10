import { z } from 'zod';

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
    APP_DEFAULT_TIMEZONE: z.string().trim().min(1).default('Europe/Paris'),
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
  };
}
