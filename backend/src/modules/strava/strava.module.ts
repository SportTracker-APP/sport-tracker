import { Module } from '@nestjs/common';

import { MailModule } from '../../mail/mail.module';
import { SummitsModule } from '../summits/summits.module';
import { PlannedWorkoutReconciliationService } from './planned-workout-reconciliation.service';
import { StravaController } from './strava.controller';
import { StravaService } from './strava.service';
import { StravaTokenEncryptionService } from './strava-token-encryption.service';
import { StravaTokenMigrationService } from './strava-token-migration.service';

@Module({
  imports: [MailModule, SummitsModule],
  controllers: [StravaController],
  providers: [
    StravaTokenEncryptionService,
    StravaTokenMigrationService,
    PlannedWorkoutReconciliationService,
    StravaService,
  ],
  exports: [StravaService],
})
export class StravaModule {}
