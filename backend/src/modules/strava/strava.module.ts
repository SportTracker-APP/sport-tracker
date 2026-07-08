import { Module } from '@nestjs/common';

import { StravaController } from './strava.controller';

import { StravaService } from './strava.service';

import { StravaTokenEncryptionService } from './strava-token-encryption.service';

import { StravaTokenMigrationService } from './strava-token-migration.service';

import { SummitsModule } from '../summits/summits.module';

@Module({
  imports: [SummitsModule],
  controllers: [StravaController],
  providers: [
    StravaTokenEncryptionService,
    StravaTokenMigrationService,
    StravaService,
  ],
  exports: [StravaService],
})
export class StravaModule {}
