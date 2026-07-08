import * as Sentry from '@sentry/nestjs';
import { config as loadEnvironment } from 'dotenv';

import { parseSentryConfig } from './observability/observability.config';

function sanitizeText(value: string | undefined): string | undefined {
  return value?.replace(
    /((?:access_?token|refresh_?token|token|password|secret)=)[^&\s]+/gi,
    '$1[REDACTED]',
  );
}

loadEnvironment({ path: ['.env.local', '.env'], quiet: true });

const config = parseSentryConfig(process.env);

Sentry.init({
  dsn: config.dsn,
  enabled: config.enabled,
  environment: config.environment,
  release: config.release,
  sendDefaultPii: false,
  tracesSampleRate: config.tracesSampleRate,
  beforeSend(event) {
    event.user = undefined;
    event.message = sanitizeText(event.message);

    for (const exception of event.exception?.values ?? []) {
      exception.value = sanitizeText(exception.value);
    }

    if (event.request) {
      event.request.cookies = undefined;
      event.request.data = undefined;
      event.request.headers = undefined;
      event.request.query_string = undefined;

      if (event.request.url) {
        event.request.url = event.request.url.split('?')[0];
      }
    }

    return event;
  },
});
