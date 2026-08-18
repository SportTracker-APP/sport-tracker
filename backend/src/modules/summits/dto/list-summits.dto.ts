import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

function optionalBoolean({ value }: { value: unknown }) {
  if (value === undefined) return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}

function optionalStringArray({ value }: { value: unknown }) {
  return typeof value === 'string'
    ? value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : value;
}

export class ListSummitsDto {
  @IsOptional()
  @IsString()
  geoAreaId?: string;

  @IsOptional()
  @Transform(optionalStringArray)
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  geoAreaIds?: string[];

  @IsOptional()
  @Transform(optionalBoolean)
  @IsBoolean()
  includeDescendants?: boolean;

  @IsOptional()
  @Transform(optionalBoolean)
  @IsBoolean()
  includeSecondary?: boolean;
}
