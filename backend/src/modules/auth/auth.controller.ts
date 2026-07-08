import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';

import { LoginDto } from './dto/login.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { CurrentUser } from './decorators/current-user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import {
  getRefreshTokenClearCookieOptions,
  getRefreshTokenCookieOptions,
  REFRESH_TOKEN_COOKIE_NAME,
} from './auth-session.constants';

function getRefreshTokenFromRequest(request: Request): string | undefined {
  const cookies: unknown = request.cookies;

  if (!cookies || typeof cookies !== 'object') {
    return undefined;
  }

  const refreshToken = (cookies as Record<string, unknown>)[
    REFRESH_TOKEN_COOKIE_NAME
  ];

  return typeof refreshToken === 'string' ? refreshToken : undefined;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto.email, dto.password);
    this.setRefreshTokenCookie(response, session.refreshToken);
    return {
      accessToken: session.accessToken,
      user: session.user,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.refreshSession(
      getRefreshTokenFromRequest(request),
    );
    this.setRefreshTokenCookie(response, session.refreshToken);
    return {
      accessToken: session.accessToken,
      user: session.user,
    };
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(getRefreshTokenFromRequest(request));
    response.clearCookie(
      REFRESH_TOKEN_COOKIE_NAME,
      getRefreshTokenClearCookieOptions(process.env.NODE_ENV === 'production'),
    );

    return { message: 'Déconnecté' };
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() request: Request) {
    return this.authService.forgotPassword(dto, {
      ip: request.ip,
    });
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('verify-email')
  async verifyEmail(
    @Query() dto: VerifyEmailDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.verifyEmail(dto);
    this.setRefreshTokenCookie(response, session.refreshToken);
    return {
      accessToken: session.accessToken,
      user: session.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(
    @CurrentUser()
    user: {
      id: string;
    },
  ) {
    return this.authService.me(user.id);
  }

  private setRefreshTokenCookie(
    response: Response,
    refreshToken: string,
  ): void {
    response.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      refreshToken,
      getRefreshTokenCookieOptions(
        this.authService.getRefreshTokenTtlSeconds(),
        process.env.NODE_ENV === 'production',
      ),
    );
  }
}
