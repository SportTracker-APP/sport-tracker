import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import type { Express } from 'express';
import helmet from 'helmet';

function normalizeOrigin(origin: string): string | null {
  try {
    return new URL(origin.trim()).origin;
  } catch {
    return null;
  }
}

function isLoopbackOrigin(origin: string): boolean {
  const normalizedOrigin = normalizeOrigin(origin);

  if (!normalizedOrigin) {
    return false;
  }

  const { hostname, protocol } = new URL(normalizedOrigin);
  const isHttpProtocol = protocol === 'http:' || protocol === 'https:';
  const isLoopbackHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]';

  return isHttpProtocol && isLoopbackHost;
}

export function isCorsOriginAllowed(
  origin: string | undefined,
  allowedOrigins: ReadonlySet<string>,
  isProduction: boolean,
): boolean {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  if (!normalizedOrigin) {
    return false;
  }

  if (allowedOrigins.has(normalizedOrigin)) {
    return true;
  }

  return !isProduction && isLoopbackOrigin(normalizedOrigin);
}

export function configureApplication(app: INestApplication): void {
  const expressApplication = app.getHttpAdapter().getInstance() as Express;
  expressApplication.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  const isProduction = process.env.NODE_ENV === 'production';
  const configuredOrigins = [process.env.FRONTEND_URL]
    .filter((origin): origin is string => Boolean(origin))
    .flatMap((origin) => origin.split(','))
    .map(normalizeOrigin)
    .filter((origin): origin is string => origin !== null);
  const allowedOrigins = new Set(configuredOrigins);

  const corsOptions: CorsOptions = {
    origin(origin, callback) {
      if (isCorsOriginAllowed(origin, allowedOrigins, isProduction)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin is not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  };
  app.enableCors(corsOptions);

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
