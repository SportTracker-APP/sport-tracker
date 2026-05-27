import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  firstName?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}