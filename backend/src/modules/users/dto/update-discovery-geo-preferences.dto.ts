import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class UpdateDiscoveryGeoPreferencesDto {
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  geoAreaIds: string[];
}
