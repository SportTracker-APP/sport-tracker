import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';

import { PrismaService } from '../prisma/prisma.service';
import type { ObservabilityConfig } from './observability.config';
import { OBSERVABILITY_CONFIG } from './observability.constants';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
    @Inject(OBSERVABILITY_CONFIG)
    private readonly config: ObservabilityConfig,
  ) {}

  @Get('live')
  getLiveness() {
    return {
      status: 'ok',
      service: this.config.serviceName,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @HealthCheck()
  getReadinessRoot() {
    return this.checkReadiness();
  }

  @Get('ready')
  @HealthCheck()
  getReadiness() {
    return this.checkReadiness();
  }

  private checkReadiness() {
    return this.health.check([
      () =>
        this.database.pingCheck('database', this.prisma, { timeout: 2_000 }),
    ]);
  }
}
