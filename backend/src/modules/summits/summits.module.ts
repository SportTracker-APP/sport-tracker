import { Module } from '@nestjs/common';

import { MailModule } from '../../mail/mail.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { GeographyModule } from '../geography/geography.module';
import { SummitDetectionWorkerService } from './summit-detection-worker.service';
import { SummitElevationService } from './summit-elevation.service';
import { SummitsController } from './summits.controller';
import { SummitsService } from './summits.service';

@Module({
  imports: [PrismaModule, MailModule, GeographyModule],
  controllers: [SummitsController],
  providers: [
    SummitsService,
    SummitDetectionWorkerService,
    SummitElevationService,
  ],
  exports: [SummitsService],
})
export class SummitsModule {}
