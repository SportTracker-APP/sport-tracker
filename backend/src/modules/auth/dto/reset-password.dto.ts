import {
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  SECURE_TOKEN_HEX_LENGTH,
} from '../auth-security.constants';

export class ResetPasswordDto {
  @IsString()
  @Length(SECURE_TOKEN_HEX_LENGTH, SECURE_TOKEN_HEX_LENGTH)
  @Matches(/^[a-f0-9]+$/i)
  token: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Le mot de passe doit contenir au moins une lettre et un chiffre',
  })
  password: string;

  @IsString()
  @MaxLength(PASSWORD_MAX_LENGTH)
  confirmPassword: string;
}
