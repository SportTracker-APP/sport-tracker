import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { UserRole } from '@prisma/client';

export class CreateAdminUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  firstName: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  lastName?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
