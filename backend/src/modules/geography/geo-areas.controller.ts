import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListGeoAreasDto } from './dto/list-geo-areas.dto';
import { GeoAreasService } from './geo-areas.service';

@Controller('geo-areas')
@UseGuards(JwtAuthGuard)
export class GeoAreasController {
  constructor(private readonly geoAreasService: GeoAreasService) {}

  @Get()
  findAll(@Query() query: ListGeoAreasDto) {
    return this.geoAreasService.findAll(query);
  }

  @Get('discovery-options')
  findDiscoveryOptions() {
    return this.geoAreasService.findDiscoveryOptions();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.geoAreasService.findBySlug(slug);
  }
}
