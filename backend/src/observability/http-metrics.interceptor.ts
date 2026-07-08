import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, catchError, finalize, throwError } from 'rxjs';

import { AlertService } from './alert.service';
import { MetricsService } from './metrics.service';

type RouteMetadata = {
  route?: { path?: unknown };
};

function getRouteLabel(request: Request): string {
  const routeMetadata = request as unknown as RouteMetadata;
  const routePath = routeMetadata.route?.path;

  if (typeof routePath !== 'string') {
    return 'unmatched';
  }

  return `${request.baseUrl}${routePath}` || '/';
}

function getStatusCode(error: unknown): number {
  return error instanceof HttpException ? error.getStatus() : 500;
}

function getErrorType(error: unknown): string {
  if (error instanceof Error) {
    return error.constructor.name || 'Error';
  }

  return 'UnknownError';
}

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    private readonly metrics: MetricsService,
    private readonly alerts: AlertService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const method = request.method;
    const startedAt = process.hrtime.bigint();
    const finishInFlight = this.metrics.startRequest(method);
    let statusCode = response.statusCode;
    let errorType: string | undefined;

    return next.handle().pipe(
      catchError((error: unknown) => {
        statusCode = getStatusCode(error);
        errorType = getErrorType(error);
        return throwError(() => error);
      }),
      finalize(() => {
        const route = getRouteLabel(request);
        const durationSeconds =
          Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;

        finishInFlight();
        this.metrics.recordRequest(method, route, statusCode, durationSeconds);

        if (errorType) {
          this.metrics.recordError(route, errorType);
          this.alerts.notifyHttpError({ method, route, statusCode, errorType });
        }
      }),
    );
  }
}
