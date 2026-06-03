import { IsString, MinLength } from 'class-validator';

export class UpdateAdminUserPasswordDto {
  @IsString()
  @MinLength(6)
  password: string;
}
