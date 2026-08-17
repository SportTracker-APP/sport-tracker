import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

function optionalBoolean({ value }: { value: unknown }) {
  if (value === undefined) return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}

export class ListSummitsDto {
  @IsOptional()
  @IsString()
  geoAreaId?: string;

  @IsOptional()
  @Transform(optionalBoolean)
  @IsBoolean()
  includeDescendants?: boolean;
}
