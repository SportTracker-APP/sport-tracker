import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';

import { MetricsGuard } from './metrics.guard';
import { MetricsService } from './metrics.service';

@Controller('metrics')
@SkipThrottle()
@UseGuards(MetricsGuard)
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  async getMetrics(@Res() response: Response): Promise<void> {
    response.type(this.metrics.contentType);
    response.send(await this.metrics.getMetrics());
  }
}
