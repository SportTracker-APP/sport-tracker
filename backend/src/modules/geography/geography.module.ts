import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { GeoAreasController } from './geo-areas.controller';
import { GeoAreasService } from './geo-areas.service';

@Module({
  imports: [PrismaModule],
  controllers: [GeoAreasController],
  providers: [GeoAreasService],
  exports: [GeoAreasService],
})
export class GeographyModule {}
