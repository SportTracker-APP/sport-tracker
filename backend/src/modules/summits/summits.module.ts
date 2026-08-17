import { Module } from '@nestjs/common';

import { MailModule } from '../../mail/mail.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { GeographyModule } from '../geography/geography.module';
import { SummitsController } from './summits.controller';
import { SummitsService } from './summits.service';

@Module({
  imports: [PrismaModule, MailModule, GeographyModule],
  controllers: [SummitsController],
  providers: [SummitsService],
  exports: [SummitsService],
})
export class SummitsModule {}
