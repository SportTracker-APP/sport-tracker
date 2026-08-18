import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { GeoAreaType } from '@prisma/client';

export class ListAdminGeoAreasDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(GeoAreaType)
  type?: GeoAreaType;
}
