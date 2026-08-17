import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

import { GeoAreaType } from '@prisma/client';

function optionalBoolean({ value }: { value: unknown }) {
  if (value === undefined) return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}

export class ListGeoAreasDto {
  @IsOptional()
  @IsEnum(GeoAreaType)
  type?: GeoAreaType;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @Transform(optionalBoolean)
  @IsBoolean()
  published?: boolean;
}
