import {
  ExecutionContext,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { firstValueFrom, of, throwError } from 'rxjs';

import { AlertService } from '../alert.service';
import { HealthController } from '../health.controller';
import { HttpMetricsInterceptor } from '../http-metrics.interceptor';
import { MetricsGuard } from '../metrics.guard';
import { MetricsService } from '../metrics.service';
import {
  ObservabilityConfig,
  parseObservabilityConfig,
  parseSentryConfig,
} from '../observability.config';

const baseConfig: ObservabilityConfig = {
  environment: 'test',
  serviceName: 'hovren-test',
  metricsEnabled: true,
  metricsToken: 'test-metrics-token-123',
  alertsEnabled: false,
  alertCooldownMs: 300_000,
};

function makeContext(authorization?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        baseUrl: '',
        route: { path: '/activities/:id' },
        headers: { authorization },
      }),
      getResponse: () => ({ statusCode: 200 }),
    }),
  } as unknown as ExecutionContext;
}

describe('observability configuration', () => {
  it('requires a webhook when operational alerts are enabled', () => {
    expect(() => parseObservabilityConfig({ ALERTS_ENABLED: 'true' })).toThrow(
      'ALERT_WEBHOOK_URL',
    );
  });

  it('rejects an invalid Sentry sample rate', () => {
    expect(() =>
      parseSentryConfig({ SENTRY_TRACES_SAMPLE_RATE: '2' }),
    ).toThrow();
  });
});

describe('HealthController', () => {
  it('does not query PostgreSQL for the root liveness endpoint', () => {
    const health = { check: jest.fn() };
    const database = { pingCheck: jest.fn() };
    const controller = new HealthController(
      health as never,
      database as never,
      {} as never,
      baseConfig,
    );

    expect(controller.getLivenessRoot()).toMatchObject({ status: 'ok' });
    expect(health.check).not.toHaveBeenCalled();
    expect(database.pingCheck).not.toHaveBeenCalled();
  });
});

describe('MetricsGuard', () => {
  it('accepts only the configured bearer token', () => {
    const guard = new MetricsGuard(baseConfig);

    expect(
      guard.canActivate(makeContext('Bearer test-metrics-token-123')),
    ).toBe(true);
    expect(() => guard.canActivate(makeContext('Bearer wrong-token'))).toThrow(
      UnauthorizedException,
    );
  });
});

describe('MetricsService', () => {
  it('exports bounded HTTP labels in Prometheus format', async () => {
    const metrics = new MetricsService(baseConfig);

    metrics.recordRequest('GET', '/activities/:id', 200, 0.025);
    metrics.recordError('/activities/:id', 'InternalServerError');

    const output = await metrics.getMetrics();

    expect(output).toContain('hovren_http_requests_total');
    expect(output).toContain('route="/activities/:id"');
    expect(output).toContain('hovren_application_errors_total');
    metrics.onModuleDestroy();
  });
});

describe('HttpMetricsInterceptor', () => {
  it('records a sanitized route and alerts only for a server error', async () => {
    const recordError = jest.fn();
    const notifyHttpError = jest.fn();
    const metrics = {
      startRequest: jest.fn(() => jest.fn()),
      recordRequest: jest.fn(),
      recordError,
    } as unknown as MetricsService;
    const alerts = {
      notifyHttpError,
    } as unknown as AlertService;
    const interceptor = new HttpMetricsInterceptor(metrics, alerts);

    await expect(
      firstValueFrom(
        interceptor.intercept(makeContext(), {
          handle: () => throwError(() => new Error('token=raw-secret')),
        }),
      ),
    ).rejects.toThrow('token=raw-secret');

    expect(recordError).toHaveBeenCalledWith('/activities/:id', 'Error');
    expect(notifyHttpError).toHaveBeenCalledWith({
      method: 'GET',
      route: '/activities/:id',
      statusCode: 500,
      errorType: 'Error',
    });
  });

  it('does not classify a successful request as an application error', async () => {
    const recordError = jest.fn();
    const notifyHttpError = jest.fn();
    const metrics = {
      startRequest: jest.fn(() => jest.fn()),
      recordRequest: jest.fn(),
      recordError,
    } as unknown as MetricsService;
    const alerts = {
      notifyHttpError,
    } as unknown as AlertService;
    const interceptor = new HttpMetricsInterceptor(metrics, alerts);

    await expect(
      firstValueFrom(
        interceptor.intercept(makeContext(), { handle: () => of({}) }),
      ),
    ).resolves.toEqual({});
    expect(recordError).not.toHaveBeenCalled();
    expect(notifyHttpError).not.toHaveBeenCalled();
  });
});

describe('AlertService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deduplicates alerts and sends only sanitized operational fields', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
    const service = new AlertService({
      ...baseConfig,
      alertsEnabled: true,
      alertWebhookUrl: 'https://alerts.example.test/hooks/hovren',
    });
    const alert = {
      method: 'POST',
      route: '/auth/reset-password',
      statusCode: 500,
      errorType: 'InternalServerError',
    };

    service.notifyHttpError(alert);
    service.notifyHttpError(alert);
    await new Promise((resolve) => setImmediate(resolve));

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const request = fetchSpy.mock.calls[0]?.[1];
    expect(typeof request?.body).toBe('string');
    const payload = JSON.parse(request?.body as string) as Record<
      string,
      unknown
    >;
    expect(JSON.stringify(payload)).not.toContain('password=');
    expect(payload).toMatchObject({
      event: {
        route: '/auth/reset-password',
        statusCode: 500,
      },
    });
  });

  it('does not alert for an expected client error', () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const service = new AlertService({
      ...baseConfig,
      alertsEnabled: true,
      alertWebhookUrl: 'https://alerts.example.test/hooks/hovren',
    });

    service.notifyHttpError({
      method: 'POST',
      route: '/auth/login',
      statusCode: new HttpException('Unauthorized', 401).getStatus(),
      errorType: 'UnauthorizedException',
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
