import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import {
  SummitCatalogTier,
  SummitImportResolutionAction,
} from '@prisma/client';

export class UpdateAdminImportCandidateDto {
  @IsOptional()
  @IsEnum(SummitCatalogTier)
  catalogTier?: SummitCatalogTier;

  @IsOptional()
  @IsEnum(SummitImportResolutionAction)
  resolutionAction?: SummitImportResolutionAction;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolutionReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  matchedSummitId?: string;
}
