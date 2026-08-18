import { IsString, MinLength } from 'class-validator';

export class SummitGeoAreaDto {
  @IsString()
  @MinLength(1)
  geoAreaId!: string;
}
