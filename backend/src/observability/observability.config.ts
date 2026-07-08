import { z } from 'zod';

function emptyStringToUndefined(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

const optionalString = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().min(1).optional(),
);

const observabilityEnvSchema = z
  .object({
    NODE_ENV: z.string().trim().min(1).default('development'),
    METRICS_ENABLED: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),
    METRICS_TOKEN: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(16).optional(),
    ),
    ALERTS_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    ALERT_WEBHOOK_URL: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().url().optional(),
    ),
    ALERT_COOLDOWN_SECONDS: z.coerce
      .number()
      .int()
      .min(30)
      .max(86_400)
      .default(300),
    SERVICE_NAME: optionalString.default('hovren-backend'),
  })
  .superRefine((value, context) => {
    if (value.ALERTS_ENABLED && !value.ALERT_WEBHOOK_URL) {
      context.addIssue({
        code: 'custom',
        path: ['ALERT_WEBHOOK_URL'],
        message: 'ALERT_WEBHOOK_URL is required when ALERTS_ENABLED=true',
      });
    }
  });

const sentryEnvSchema = z.object({
  SENTRY_DSN: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().url().optional(),
  ),
  SENTRY_ENVIRONMENT: optionalString,
  SENTRY_RELEASE: optionalString,
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
  NODE_ENV: z.string().trim().min(1).default('development'),
});

export type ObservabilityConfig = {
  environment: string;
  serviceName: string;
  metricsEnabled: boolean;
  metricsToken?: string;
  alertsEnabled: boolean;
  alertWebhookUrl?: string;
  alertCooldownMs: number;
};

export type SentryConfig = {
  dsn?: string;
  enabled: boolean;
  environment: string;
  release?: string;
  tracesSampleRate: number;
};

export function parseObservabilityConfig(
  environment: Record<string, string | undefined>,
): ObservabilityConfig {
  const parsed = observabilityEnvSchema.parse(environment);

  return {
    environment: parsed.NODE_ENV,
    serviceName: parsed.SERVICE_NAME,
    metricsEnabled: parsed.METRICS_ENABLED,
    metricsToken: parsed.METRICS_TOKEN,
    alertsEnabled: parsed.ALERTS_ENABLED,
    alertWebhookUrl: parsed.ALERT_WEBHOOK_URL,
    alertCooldownMs: parsed.ALERT_COOLDOWN_SECONDS * 1000,
  };
}

export function parseSentryConfig(
  environment: Record<string, string | undefined>,
): SentryConfig {
  const parsed = sentryEnvSchema.parse(environment);

  return {
    dsn: parsed.SENTRY_DSN,
    enabled: Boolean(parsed.SENTRY_DSN),
    environment: parsed.SENTRY_ENVIRONMENT ?? parsed.NODE_ENV,
    release: parsed.SENTRY_RELEASE,
    tracesSampleRate: parsed.SENTRY_TRACES_SAMPLE_RATE,
  };
}
