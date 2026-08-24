import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  SummitCatalogStatus,
  SummitCatalogTier,
  SummitExternalProvider,
} from '@prisma/client';

class CreateSummitExternalReferenceDto {
  @IsEnum(SummitExternalProvider)
  provider!: SummitExternalProvider;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  externalId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  sourceName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sourceVersion?: string;
}

export class CreateAdminSummitDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9_000)
  altitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  type!: string;

  @IsString()
  @MinLength(1)
  primaryMassifId!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsString({ each: true })
  geoAreaIds?: string[];

  @IsEnum(SummitCatalogTier)
  catalogTier!: SummitCatalogTier;

  @IsEnum(SummitCatalogStatus)
  catalogStatus!: SummitCatalogStatus;

  @IsBoolean()
  isActive!: boolean;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2_000)
  sourceUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSummitExternalReferenceDto)
  externalReference?: CreateSummitExternalReferenceDto;
}
