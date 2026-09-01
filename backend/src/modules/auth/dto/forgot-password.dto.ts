import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';

import { EMAIL_MAX_LENGTH } from '../auth-security.constants';
import { normalizeEmailInput } from './normalize-email';

export class ForgotPasswordDto {
  @Transform(({ value }: { value: unknown }) => normalizeEmailInput(value))
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  email: string;
}
