import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { SummitCatalogStatus, SummitCatalogTier } from '@prisma/client';

function optionalBoolean({ value }: { value: unknown }) {
  if (value === undefined) return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}

export class ListAdminSummitsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(SummitCatalogStatus)
  status?: SummitCatalogStatus;

  @IsOptional()
  @IsEnum(SummitCatalogTier)
  tier?: SummitCatalogTier;

  @IsOptional()
  @Transform(optionalBoolean)
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @Transform(optionalBoolean)
  @IsBoolean()
  massifMissing?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number = 20;
}
