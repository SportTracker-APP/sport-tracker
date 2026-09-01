import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { UserRole } from '@prisma/client';
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../../auth/auth-security.constants';
import { normalizeEmailInput } from '../../auth/dto/normalize-email';

export class CreateAdminUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  firstName: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  lastName?: string;

  @Transform(({ value }: { value: unknown }) => normalizeEmailInput(value))
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  email: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
