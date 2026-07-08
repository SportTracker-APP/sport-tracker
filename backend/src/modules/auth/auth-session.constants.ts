import type { CookieOptions } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'sport_tracker_refresh_token';
export const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 24 * 60 * 60;

export function getRefreshTokenCookieOptions(
  refreshTokenTtlSeconds: number,
  isProduction: boolean,
): CookieOptions {
  return {
    httpOnly: true,
    maxAge: refreshTokenTtlSeconds * 1_000,
    path: '/auth',
    sameSite: 'lax',
    secure: isProduction,
  };
}

export function getRefreshTokenClearCookieOptions(
  isProduction: boolean,
): CookieOptions {
  return {
    httpOnly: true,
    path: '/auth',
    sameSite: 'lax',
    secure: isProduction,
  };
}
