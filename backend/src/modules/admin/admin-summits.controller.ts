import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { AuthenticatedRequest } from '../auth/authenticated-request.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminSummitsService } from './admin-summits.service';
import { ListAdminGeoAreasDto } from './dto/list-admin-geo-areas.dto';
import { ListAdminImportCandidatesDto } from './dto/list-admin-import-candidates.dto';
import { ListAdminSummitsDto } from './dto/list-admin-summits.dto';
import { SummitGeoAreaDto } from './dto/summit-geo-area.dto';
import { UpdateAdminSummitDto } from './dto/update-admin-summit.dto';
import { UpdateAdminImportCandidateDto } from './dto/update-admin-import-candidate.dto';
import { AdminGuard } from './guards/admin.guard';

@Controller('admin/summits')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSummitsController {
  constructor(private readonly adminSummitsService: AdminSummitsService) {}

  @Get()
  findAll(@Query() query: ListAdminSummitsDto) {
    return this.adminSummitsService.findAll(query);
  }

  @Get('geo-areas/options')
  findGeoAreaOptions(@Query() query: ListAdminGeoAreasDto) {
    return this.adminSummitsService.findGeoAreaOptions(query);
  }

  @Get('import-runs')
  findImportRuns() {
    return this.adminSummitsService.findImportRuns();
  }

  @Get('import-runs/:importRunId')
  findImportRun(
    @Param('importRunId') importRunId: string,
    @Query() query: ListAdminImportCandidatesDto,
  ) {
    return this.adminSummitsService.findImportRun(importRunId, query);
  }

  @Patch('import-runs/:importRunId/candidates/:candidateId')
  updateImportCandidate(
    @Req() request: AuthenticatedRequest,
    @Param('importRunId') importRunId: string,
    @Param('candidateId') candidateId: string,
    @Body() dto: UpdateAdminImportCandidateDto,
  ) {
    return this.adminSummitsService.updateImportCandidate(
      request.user.id,
      importRunId,
      candidateId,
      dto,
    );
  }

  @Post('import-runs/:importRunId/publish')
  publishImportRun(
    @Req() request: AuthenticatedRequest,
    @Param('importRunId') importRunId: string,
  ) {
    return this.adminSummitsService.publishImportRun(
      request.user.id,
      importRunId,
    );
  }

  @Get(':id')
  findOne(@Param('id') summitId: string) {
    return this.adminSummitsService.findOne(summitId);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') summitId: string,
    @Body() dto: UpdateAdminSummitDto,
  ) {
    return this.adminSummitsService.update(request.user.id, summitId, dto);
  }

  @Post(':id/geo-areas')
  addGeoArea(
    @Req() request: AuthenticatedRequest,
    @Param('id') summitId: string,
    @Body() dto: SummitGeoAreaDto,
  ) {
    return this.adminSummitsService.addGeoArea(
      request.user.id,
      summitId,
      dto.geoAreaId,
    );
  }

  @Delete(':id/geo-areas/:geoAreaId')
  removeGeoArea(
    @Req() request: AuthenticatedRequest,
    @Param('id') summitId: string,
    @Param('geoAreaId') geoAreaId: string,
  ) {
    return this.adminSummitsService.removeGeoArea(
      request.user.id,
      summitId,
      geoAreaId,
    );
  }

  @Patch(':id/primary-massif')
  updatePrimaryMassif(
    @Req() request: AuthenticatedRequest,
    @Param('id') summitId: string,
    @Body() dto: SummitGeoAreaDto,
  ) {
    return this.adminSummitsService.updatePrimaryMassif(
      request.user.id,
      summitId,
      dto.geoAreaId,
    );
  }
}
