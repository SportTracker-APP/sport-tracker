import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../auth-security.constants';
import { normalizeEmailInput } from './normalize-email';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  firstName: string;

  @Transform(({ value }: { value: unknown }) => normalizeEmailInput(value))
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  email: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Le mot de passe doit contenir au moins une lettre et un chiffre',
  })
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;
}
