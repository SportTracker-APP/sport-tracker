import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { SummitCatalogStatus, SummitCatalogTier } from '@prisma/client';

export class UpdateAdminSummitDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(160, { each: true })
  aliases?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9000)
  altitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  difficulty?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  type?: string;

  @IsOptional()
  @IsEnum(SummitCatalogStatus)
  catalogStatus?: SummitCatalogStatus;

  @IsOptional()
  @IsEnum(SummitCatalogTier)
  catalogTier?: SummitCatalogTier;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
