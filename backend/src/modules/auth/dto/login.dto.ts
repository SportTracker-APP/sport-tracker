import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength } from 'class-validator';

import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
} from '../auth-security.constants';

export class LoginDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  email: string;

  @IsString()
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;
}
