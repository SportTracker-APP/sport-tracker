import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';

import { OBSERVABILITY_CONFIG } from './observability.constants';
import type { ObservabilityConfig } from './observability.config';

const HTTP_LABELS = ['method', 'route', 'status_code'] as const;
const ERROR_LABELS = ['route', 'error_type'] as const;

@Injectable()
export class MetricsService implements OnModuleDestroy {
  private readonly registry = new Registry();
  private readonly requestsTotal: Counter<(typeof HTTP_LABELS)[number]>;
  private readonly requestDuration: Histogram<(typeof HTTP_LABELS)[number]>;
  private readonly requestsInFlight: Gauge<'method'>;
  private readonly errorsTotal: Counter<(typeof ERROR_LABELS)[number]>;

  constructor(
    @Inject(OBSERVABILITY_CONFIG)
    private readonly config: ObservabilityConfig,
  ) {
    this.registry.setDefaultLabels({
      service: config.serviceName,
      environment: config.environment,
    });
    collectDefaultMetrics({
      prefix: 'montara_',
      register: this.registry,
    });
    this.requestsTotal = new Counter({
      name: 'montara_http_requests_total',
      help: 'Total number of HTTP requests handled by the API',
      labelNames: HTTP_LABELS,
      registers: [this.registry],
    });
    this.requestDuration = new Histogram({
      name: 'montara_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: HTTP_LABELS,
      buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });
    this.requestsInFlight = new Gauge({
      name: 'montara_http_requests_in_flight',
      help: 'Current number of HTTP requests being processed',
      labelNames: ['method'] as const,
      registers: [this.registry],
    });
    this.errorsTotal = new Counter({
      name: 'montara_application_errors_total',
      help: 'Total number of HTTP errors grouped by route and error type',
      labelNames: ERROR_LABELS,
      registers: [this.registry],
    });
  }

  startRequest(method: string): () => void {
    if (!this.config.metricsEnabled) {
      return () => undefined;
    }

    this.requestsInFlight.inc({ method });

    return () => this.requestsInFlight.dec({ method });
  }

  recordRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    if (!this.config.metricsEnabled) {
      return;
    }

    const labels = {
      method,
      route,
      status_code: String(statusCode),
    };
    this.requestsTotal.inc(labels);
    this.requestDuration.observe(labels, durationSeconds);
  }

  recordError(route: string, errorType: string): void {
    if (this.config.metricsEnabled) {
      this.errorsTotal.inc({ route, error_type: errorType });
    }
  }

  get contentType(): string {
    return this.registry.contentType;
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  onModuleDestroy(): void {
    this.registry.clear();
  }
}
