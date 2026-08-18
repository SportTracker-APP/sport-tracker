import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateSummitDiscoveryDto } from './dto/update-summit-discovery.dto';
import { ListSummitsDto } from './dto/list-summits.dto';
import { SummitsService } from './summits.service';

@Controller('summits')
@UseGuards(JwtAuthGuard)
export class SummitsController {
  constructor(private readonly summitsService: SummitsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query() query: ListSummitsDto) {
    return this.summitsService.findAll(userId, query);
  }

  @Get('badges')
  findBadges(@CurrentUser('id') userId: string) {
    return this.summitsService.findBadges(userId);
  }

  @Get('map')
  findMapSummits(
    @CurrentUser('id') userId: string,
    @Query() query: ListSummitsDto,
  ) {
    return this.summitsService.findMapSummits(userId, query);
  }

  @Patch('discoveries/:id')
  updateDiscovery(
    @CurrentUser('id') userId: string,
    @Param('id') discoveryId: string,
    @Body() dto: UpdateSummitDiscoveryDto,
  ) {
    return this.summitsService.updateDiscovery(userId, discoveryId, dto);
  }

  @Delete(':summitId/discovery')
  dismissSummit(
    @CurrentUser('id') userId: string,
    @Param('summitId') summitId: string,
  ) {
    return this.summitsService.dismissSummit(userId, summitId);
  }
}
