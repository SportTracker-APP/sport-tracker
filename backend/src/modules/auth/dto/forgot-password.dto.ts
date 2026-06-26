import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';

import { EMAIL_MAX_LENGTH } from '../auth-security.constants';

export class ForgotPasswordDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  email: string;
}
