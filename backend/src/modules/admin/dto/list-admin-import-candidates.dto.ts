import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

import { SummitCatalogTier } from '@prisma/client';

export enum AdminImportCandidateView {
  ALL = 'ALL',
  CONFLICTS = 'CONFLICTS',
  LEGACY = 'LEGACY',
  WITHOUT_MASSIF = 'WITHOUT_MASSIF',
  RESOLVED = 'RESOLVED',
  HOMONYMS = 'HOMONYMS',
}

export class ListAdminImportCandidatesDto {
  @IsOptional()
  @IsEnum(SummitCatalogTier)
  tier?: SummitCatalogTier;

  @IsOptional()
  @IsEnum(AdminImportCandidateView)
  view: AdminImportCandidateView = AdminImportCandidateView.ALL;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 50;
}
