import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';

import { AlertService } from './alert.service';
import { HealthController } from './health.controller';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';
import { MetricsController } from './metrics.controller';
import { MetricsGuard } from './metrics.guard';
import { MetricsService } from './metrics.service';
import { parseObservabilityConfig } from './observability.config';
import { OBSERVABILITY_CONFIG } from './observability.constants';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController, MetricsController],
  providers: [
    {
      provide: OBSERVABILITY_CONFIG,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        parseObservabilityConfig({
          NODE_ENV: configService.get<string>('NODE_ENV'),
          METRICS_ENABLED: configService.get<string>('METRICS_ENABLED'),
          METRICS_TOKEN: configService.get<string>('METRICS_TOKEN'),
          ALERTS_ENABLED: configService.get<string>('ALERTS_ENABLED'),
          ALERT_WEBHOOK_URL: configService.get<string>('ALERT_WEBHOOK_URL'),
          ALERT_COOLDOWN_SECONDS: configService.get<string>(
            'ALERT_COOLDOWN_SECONDS',
          ),
          SERVICE_NAME: configService.get<string>('SERVICE_NAME'),
        }),
    },
    AlertService,
    MetricsService,
    MetricsGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
  ],
})
export class ObservabilityModule {}
