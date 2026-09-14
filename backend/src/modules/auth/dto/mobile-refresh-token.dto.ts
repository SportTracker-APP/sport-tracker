import { IsJWT, IsString, MaxLength } from 'class-validator';

const MOBILE_REFRESH_TOKEN_MAX_LENGTH = 4096;

export class MobileRefreshTokenDto {
  @IsString()
  @IsJWT()
  @MaxLength(MOBILE_REFRESH_TOKEN_MAX_LENGTH)
  refreshToken: string;
}
