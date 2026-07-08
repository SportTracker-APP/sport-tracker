import { Inject, Injectable, Logger } from '@nestjs/common';

import { OBSERVABILITY_CONFIG } from './observability.constants';
import type { ObservabilityConfig } from './observability.config';

export type HttpErrorAlert = {
  method: string;
  route: string;
  statusCode: number;
  errorType: string;
};

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private readonly lastSentAt = new Map<string, number>();

  constructor(
    @Inject(OBSERVABILITY_CONFIG)
    private readonly config: ObservabilityConfig,
  ) {}

  notifyHttpError(alert: HttpErrorAlert): void {
    if (
      !this.config.alertsEnabled ||
      !this.config.alertWebhookUrl ||
      alert.statusCode < 500
    ) {
      return;
    }

    const key = [
      alert.method,
      alert.route,
      alert.statusCode,
      alert.errorType,
    ].join(':');
    const now = Date.now();

    if (now - (this.lastSentAt.get(key) ?? 0) < this.config.alertCooldownMs) {
      return;
    }

    this.lastSentAt.set(key, now);
    void this.sendWebhook(alert);
  }

  private async sendWebhook(alert: HttpErrorAlert): Promise<void> {
    const summary = `[${this.config.serviceName}] ${alert.statusCode} ${alert.method} ${alert.route} (${alert.errorType})`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);

    try {
      const response = await fetch(this.config.alertWebhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          text: summary,
          content: summary,
          event: {
            type: 'http_error',
            service: this.config.serviceName,
            environment: this.config.environment,
            method: alert.method,
            route: alert.route,
            statusCode: alert.statusCode,
            errorType: alert.errorType,
            occurredAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Alert webhook returned status ${response.status}`);
      }

      this.logger.log({
        eventType: 'http_error',
        statusCode: alert.statusCode,
        route: alert.route,
        message: 'Operational alert sent',
      });
    } catch {
      this.logger.error({
        eventType: 'http_error',
        statusCode: alert.statusCode,
        route: alert.route,
        message: 'Operational alert delivery failed',
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}
