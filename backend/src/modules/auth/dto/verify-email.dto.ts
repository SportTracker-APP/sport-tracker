import { IsString, Length, Matches } from 'class-validator';

import { SECURE_TOKEN_HEX_LENGTH } from '../auth-security.constants';

export class VerifyEmailDto {
  @IsString()
  @Length(SECURE_TOKEN_HEX_LENGTH, SECURE_TOKEN_HEX_LENGTH)
  @Matches(/^[a-f0-9]+$/i)
  token: string;
}
