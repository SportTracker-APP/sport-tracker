import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class AdminSummitImageDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  imageCredit?: string;

  @ValidateIf((_object, value) => value !== undefined && value !== '')
  @IsUrl({ require_protocol: true })
  @MaxLength(2_000)
  sourceUrl?: string;
}
