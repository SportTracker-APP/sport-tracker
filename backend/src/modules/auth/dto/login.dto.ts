import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength } from 'class-validator';

import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
} from '../auth-security.constants';
import { normalizeEmailInput } from './normalize-email';

export class LoginDto {
  @Transform(({ value }: { value: unknown }) => normalizeEmailInput(value))
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  email: string;

  @IsString()
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;
}
