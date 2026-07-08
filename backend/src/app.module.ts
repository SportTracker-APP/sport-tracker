import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';

import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './modules/auth/auth.module';

import { UsersModule } from './modules/users/users.module';

import { UploadModule } from './modules/upload/upload.module';

import { ActivitiesModule } from './modules/activities/activities.module';

import { StravaModule } from './modules/strava/strava.module';

import { AdminModule } from './modules/admin/admin.module';

import { GoalsModule } from './modules/goals/goals.module';

import { SummitsModule } from './modules/summits/summits.module';
import { ObservabilityModule } from './observability/observability.module';

@Module({
  imports: [
    SentryModule.forRoot(),

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),

    PrismaModule,

    AuthModule,

    UsersModule,

    UploadModule,

    ActivitiesModule,

    StravaModule,

    AdminModule,

    GoalsModule,

    SummitsModule,

    ObservabilityModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
