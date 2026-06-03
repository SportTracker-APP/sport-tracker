import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './modules/auth/auth.module';

import { UsersModule } from './modules/users/users.module';

import { UploadModule } from './modules/upload/upload.module';

import { ActivitiesModule } from './modules/activities/activities.module';

import { StravaModule } from './modules/strava/strava.module';

import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    PrismaModule,

    AuthModule,

    UsersModule,

    UploadModule,

    ActivitiesModule,

    StravaModule,

    AdminModule,
  ],
})
export class AppModule {}
