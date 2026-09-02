import type { Request, Response } from 'express';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './google-auth.service';

function makeResponse() {
  const clearCookie = jest.fn();
  const cookie = jest.fn();
  const redirect = jest.fn();

  return {
    clearCookie,
    cookie,
    redirect,
    response: {
      clearCookie,
      cookie,
      redirect,
    } as unknown as Response,
  };
}

function makeController() {
  const loginWithGoogle = jest.fn().mockResolvedValue({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: {
      id: 'user-1',
      firstName: 'Camille',
      email: 'camille@example.test',
      role: 'USER',
    },
  });
  const createAuthorizationUrl = jest
    .fn()
    .mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth');
  const exchangeCode = jest.fn().mockResolvedValue({
    subject: 'google-subject-1',
    email: 'camille@example.test',
    firstName: 'Camille',
    lastName: null,
  });
  const authService = {
    getRefreshTokenTtlSeconds: jest.fn().mockReturnValue(86_400),
    loginWithGoogle,
  };
  const googleAuthService = {
    createAuthorizationUrl,
    exchangeCode,
  };

  return {
    authService,
    createAuthorizationUrl,
    exchangeCode,
    googleAuthService,
    loginWithGoogle,
    controller: new AuthController(
      authService as unknown as AuthService,
      googleAuthService as unknown as GoogleAuthService,
    ),
  };
}

describe('AuthController Google OAuth', () => {
  const originalFrontendUrl = process.env.FRONTEND_URL;

  beforeEach(() => {
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    process.env.FRONTEND_URL = originalFrontendUrl;
    jest.restoreAllMocks();
  });

  it('stores an HttpOnly state before redirecting to Google', () => {
    const { controller, createAuthorizationUrl } = makeController();
    const { cookie, redirect, response } = makeResponse();

    controller.google('/refuge', response);

    const state = cookie.mock.calls[0]?.[1] as string;

    expect(state).toHaveLength(43);
    expect(cookie).toHaveBeenNthCalledWith(
      1,
      'hovren_google_oauth_state',
      state,
      expect.objectContaining({
        httpOnly: true,
        maxAge: 600_000,
        sameSite: 'lax',
      }),
    );
    expect(createAuthorizationUrl).toHaveBeenCalledWith(state);
    expect(redirect).toHaveBeenCalledWith(
      'https://accounts.google.com/o/oauth2/v2/auth',
    );
  });

  it('rejects a callback whose state does not match the browser cookie', async () => {
    const { controller, exchangeCode, loginWithGoogle } = makeController();
    const { redirect, response } = makeResponse();
    const request = {
      cookies: {
        hovren_google_oauth_state: 'expected-state',
        hovren_google_oauth_return_to: '/refuge',
      },
    } as unknown as Request;

    await controller.googleCallback(
      'one-time-code',
      'different-state',
      undefined,
      request,
      response,
    );

    expect(exchangeCode).not.toHaveBeenCalled();
    expect(loginWithGoogle).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith(
      'http://localhost:3000/login?google=error&returnTo=%2Frefuge',
    );
  });

  it('sets the regular HOVREN refresh cookie after a valid callback', async () => {
    const { controller, exchangeCode, loginWithGoogle } = makeController();
    const { cookie, redirect, response } = makeResponse();
    const request = {
      cookies: {
        hovren_google_oauth_state: 'matching-state',
        hovren_google_oauth_return_to: '/refuge',
      },
    } as unknown as Request;

    await controller.googleCallback(
      'one-time-code',
      'matching-state',
      undefined,
      request,
      response,
    );

    expect(exchangeCode).toHaveBeenCalledWith('one-time-code');
    expect(loginWithGoogle).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'google-subject-1',
      }),
    );
    expect(cookie).toHaveBeenCalledWith(
      'sport_tracker_refresh_token',
      'refresh-token',
      expect.objectContaining({
        httpOnly: true,
        path: '/auth',
        sameSite: 'lax',
      }),
    );
    expect(redirect).toHaveBeenCalledWith(
      'http://localhost:3000/login?google=success&returnTo=%2Frefuge',
    );
  });
});
