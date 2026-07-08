import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateSummitDiscoveryDto } from './dto/update-summit-discovery.dto';
import { SummitsService } from './summits.service';

@Controller('summits')
@UseGuards(JwtAuthGuard)
export class SummitsController {
  constructor(private readonly summitsService: SummitsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.summitsService.findAll(userId);
  }

  @Get('badges')
  findBadges(@CurrentUser('id') userId: string) {
    return this.summitsService.findBadges(userId);
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
