import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './modules/auth/auth.module';

import { UsersModule } from './modules/users/users.module';

import { UploadModule } from "./modules/upload/upload.module";

import { ActivitiesModule } from "./modules/activities/activities.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,

    AuthModule,

    UsersModule,

    UploadModule,

    ActivitiesModule,
  ],
})
export class AppModule {}