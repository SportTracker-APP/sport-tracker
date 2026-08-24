import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import type { AuthenticatedRequest } from '../auth/authenticated-request.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminSummitsService } from './admin-summits.service';
import { AdminSummitMediaService } from './admin-summit-media.service';
import { AdminSummitImageDto } from './dto/admin-summit-image.dto';
import { CreateAdminSummitDto } from './dto/create-admin-summit.dto';
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
  constructor(
    private readonly adminSummitsService: AdminSummitsService,
    private readonly adminSummitMediaService: AdminSummitMediaService,
  ) {}

  @Get()
  findAll(@Query() query: ListAdminSummitsDto) {
    return this.adminSummitsService.findAll(query);
  }

  @Get('geo-areas/options')
  findGeoAreaOptions(@Query() query: ListAdminGeoAreasDto) {
    return this.adminSummitsService.findGeoAreaOptions(query);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateAdminSummitDto,
  ) {
    return this.adminSummitsService.create(request.user.id, dto);
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

  @Post('import-runs/:importRunId/publish-resolutions')
  publishComplementaryResolutions(
    @Req() request: AuthenticatedRequest,
    @Param('importRunId') importRunId: string,
  ) {
    return this.adminSummitsService.publishComplementaryResolutions(
      request.user.id,
      importRunId,
    );
  }

  @Get(':id')
  findOne(@Param('id') summitId: string) {
    return this.adminSummitsService.findOne(summitId);
  }

  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  async uploadImage(
    @Req() request: AuthenticatedRequest,
    @Param('id') summitId: string,
    @Body() dto: AdminSummitImageDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 8 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    await this.adminSummitMediaService.upload(
      request.user.id,
      summitId,
      file,
      dto,
    );
    return this.adminSummitsService.findOne(summitId);
  }

  @Patch(':id/image')
  async updateImageMetadata(
    @Req() request: AuthenticatedRequest,
    @Param('id') summitId: string,
    @Body() dto: AdminSummitImageDto,
  ) {
    await this.adminSummitMediaService.updateMetadata(
      request.user.id,
      summitId,
      dto,
    );
    return this.adminSummitsService.findOne(summitId);
  }

  @Delete(':id/image')
  async removeImage(
    @Req() request: AuthenticatedRequest,
    @Param('id') summitId: string,
  ) {
    await this.adminSummitMediaService.remove(request.user.id, summitId);
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
