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
import { randomBytes, timingSafeEqual } from 'crypto';

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
import { GoogleAuthService } from './google-auth.service';

const GOOGLE_OAUTH_STATE_COOKIE_NAME = 'hovren_google_oauth_state';
const GOOGLE_OAUTH_RETURN_TO_COOKIE_NAME = 'hovren_google_oauth_return_to';
const GOOGLE_OAUTH_COOKIE_MAX_AGE_MS = 10 * 60 * 1_000;

function getCookieFromRequest(
  request: Request,
  cookieName: string,
): string | undefined {
  const cookies: unknown = request.cookies;

  if (!cookies || typeof cookies !== 'object') {
    return undefined;
  }

  const value = (cookies as Record<string, unknown>)[cookieName];

  return typeof value === 'string' ? value : undefined;
}

function getRefreshTokenFromRequest(request: Request): string | undefined {
  return getCookieFromRequest(request, REFRESH_TOKEN_COOKIE_NAME);
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

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

  @Get('google')
  google(
    @Query('returnTo') requestedReturnTo: string | undefined,
    @Res() response: Response,
  ) {
    const state = randomBytes(32).toString('base64url');
    const returnTo = this.normalizeReturnTo(requestedReturnTo);
    const cookieOptions = this.getGoogleCookieOptions();

    response.cookie(GOOGLE_OAUTH_STATE_COOKIE_NAME, state, cookieOptions);
    response.cookie(
      GOOGLE_OAUTH_RETURN_TO_COOKIE_NAME,
      returnTo,
      cookieOptions,
    );
    response.redirect(this.googleAuthService.createAuthorizationUrl(state));
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') googleError: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const expectedState = getCookieFromRequest(
      request,
      GOOGLE_OAUTH_STATE_COOKIE_NAME,
    );
    const returnTo = this.normalizeReturnTo(
      getCookieFromRequest(request, GOOGLE_OAUTH_RETURN_TO_COOKIE_NAME),
    );

    this.clearGoogleCookies(response);

    if (
      googleError ||
      !code ||
      !state ||
      !expectedState ||
      !this.statesMatch(state, expectedState)
    ) {
      response.redirect(this.buildFrontendAuthUrl('error', returnTo));
      return;
    }

    try {
      const identity = await this.googleAuthService.exchangeCode(code);
      const session = await this.authService.loginWithGoogle(identity);

      this.setRefreshTokenCookie(response, session.refreshToken);
      response.redirect(this.buildFrontendAuthUrl('success', returnTo));
    } catch {
      response.redirect(this.buildFrontendAuthUrl('error', returnTo));
    }
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

  private getGoogleCookieOptions() {
    return {
      httpOnly: true,
      maxAge: GOOGLE_OAUTH_COOKIE_MAX_AGE_MS,
      path: '/auth/google',
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    };
  }

  private clearGoogleCookies(response: Response): void {
    const { maxAge: _maxAge, ...options } = this.getGoogleCookieOptions();
    void _maxAge;
    response.clearCookie(GOOGLE_OAUTH_STATE_COOKIE_NAME, options);
    response.clearCookie(GOOGLE_OAUTH_RETURN_TO_COOKIE_NAME, options);
  }

  private statesMatch(receivedState: string, expectedState: string): boolean {
    const received = Buffer.from(receivedState);
    const expected = Buffer.from(expectedState);

    return (
      received.length === expected.length && timingSafeEqual(received, expected)
    );
  }

  private normalizeReturnTo(returnTo?: string): string {
    if (returnTo?.startsWith('/') && !returnTo.startsWith('//')) {
      return returnTo;
    }

    return '/refuge';
  }

  private buildFrontendAuthUrl(
    status: 'success' | 'error',
    returnTo: string,
  ): string {
    const configuredFrontendUrl =
      process.env.FRONTEND_URL?.split(',')[0]?.trim() ||
      process.env.APP_BASE_URL?.trim() ||
      'http://localhost:3000';
    const callbackUrl = new URL('/login', configuredFrontendUrl);

    callbackUrl.searchParams.set('google', status);
    callbackUrl.searchParams.set('returnTo', returnTo);

    return callbackUrl.toString();
  }
}
