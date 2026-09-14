import { apiRequest } from '@/src/api/client';
import type {
  AuthUser,
  MobileSession,
  PasswordCredentials,
  RegistrationCredentials,
  RegistrationResponse,
} from '@/src/auth/contracts';

export function registerWithPassword(
  credentials: RegistrationCredentials,
): Promise<RegistrationResponse> {
  return apiRequest<RegistrationResponse>('/auth/register', {
    authenticated: false,
    json: credentials,
    method: 'POST',
    retryOnUnauthorized: false,
  });
}

export function loginWithPassword(
  credentials: PasswordCredentials,
): Promise<MobileSession> {
  return apiRequest<MobileSession>('/auth/mobile/login', {
    authenticated: false,
    json: credentials,
    method: 'POST',
    retryOnUnauthorized: false,
  });
}

export function refreshMobileSession(
  refreshToken: string,
): Promise<MobileSession> {
  return apiRequest<MobileSession>('/auth/mobile/refresh', {
    authenticated: false,
    json: { refreshToken },
    method: 'POST',
    retryOnUnauthorized: false,
  });
}

export async function logoutMobileSession(refreshToken: string): Promise<void> {
  await apiRequest<unknown>('/auth/mobile/logout', {
    authenticated: false,
    json: { refreshToken },
    method: 'POST',
    retryOnUnauthorized: false,
  });
}

export function getCurrentUser(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me');
}
