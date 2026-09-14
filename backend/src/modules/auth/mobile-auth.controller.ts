import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { MobileRefreshTokenDto } from './dto/mobile-refresh-token.dto';

@Controller('auth/mobile')
export class MobileAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.loginMobile(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: MobileRefreshTokenDto) {
    return this.authService.refreshMobileSession(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: MobileRefreshTokenDto) {
    await this.authService.logoutMobileSession(dto.refreshToken);

    return { message: 'Déconnecté' };
  }
}
