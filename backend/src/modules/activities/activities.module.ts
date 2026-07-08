import { Module } from '@nestjs/common';

import { ActivitiesController } from './activities.controller';

import { ActivitiesService } from './activities.service';

import { PrismaModule } from '../../prisma/prisma.module';
import { MailModule } from '../../mail/mail.module';
import { StravaModule } from '../strava/strava.module';
import { SummitsModule } from '../summits/summits.module';

@Module({
  imports: [PrismaModule, StravaModule, MailModule, SummitsModule],

  controllers: [ActivitiesController],

  providers: [ActivitiesService],
})
export class ActivitiesModule {}
