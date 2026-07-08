import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

import type { ObservabilityConfig } from './observability.config';
import { OBSERVABILITY_CONFIG } from './observability.constants';

function tokensMatch(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

@Injectable()
export class MetricsGuard implements CanActivate {
  constructor(
    @Inject(OBSERVABILITY_CONFIG)
    private readonly config: ObservabilityConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.config.metricsEnabled || !this.config.metricsToken) {
      throw new ServiceUnavailableException('Metrics endpoint is disabled');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : '';

    if (!token || !tokensMatch(token, this.config.metricsToken)) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
