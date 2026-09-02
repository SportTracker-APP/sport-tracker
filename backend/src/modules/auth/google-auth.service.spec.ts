import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

import { GoogleAuthService } from './google-auth.service';

function makeService(overrides: Record<string, string> = {}) {
  const values: Record<string, string> = {
    GOOGLE_CALLBACK_URL: 'http://localhost:4000/auth/google/callback',
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_CLIENT_SECRET: 'google-client-secret',
    ...overrides,
  };
  const configService = {
    get: jest.fn((key: string) => values[key]),
  };

  return new GoogleAuthService(configService as unknown as ConfigService);
}

describe('GoogleAuthService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('builds a server-side authorization URL with state and identity scopes', () => {
    const authorizationUrl = new URL(
      makeService().createAuthorizationUrl('secure-state'),
    );

    expect(authorizationUrl.origin).toBe('https://accounts.google.com');
    expect(authorizationUrl.searchParams.get('client_id')).toBe(
      'google-client-id',
    );
    expect(authorizationUrl.searchParams.get('redirect_uri')).toBe(
      'http://localhost:4000/auth/google/callback',
    );
    expect(authorizationUrl.searchParams.get('state')).toBe('secure-state');
    expect(authorizationUrl.searchParams.get('scope')).toContain('openid');
    expect(authorizationUrl.searchParams.get('scope')).toContain('email');
    expect(authorizationUrl.searchParams.get('scope')).toContain('profile');
  });

  it('rejects the flow when Google configuration is missing', () => {
    const service = makeService({ GOOGLE_CLIENT_SECRET: '' });

    expect(() => service.createAuthorizationUrl('state')).toThrow(
      ServiceUnavailableException,
    );
  });

  it('accepts only a verified Google identity', async () => {
    jest.spyOn(OAuth2Client.prototype, 'getToken').mockResolvedValue({
      tokens: {
        id_token: 'signed-google-id-token',
      },
      res: null,
    });
    jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
      getPayload: () => ({
        sub: 'google-subject-1',
        email: 'camille@example.test',
        email_verified: true,
        given_name: 'Camille',
        family_name: 'Martin',
      }),
    } as never);

    await expect(makeService().exchangeCode('one-time-code')).resolves.toEqual({
      subject: 'google-subject-1',
      email: 'camille@example.test',
      firstName: 'Camille',
      lastName: 'Martin',
    });
  });

  it('rejects an unverified Google email', async () => {
    jest.spyOn(OAuth2Client.prototype, 'getToken').mockResolvedValue({
      tokens: {
        id_token: 'signed-google-id-token',
      },
      res: null,
    });
    jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
      getPayload: () => ({
        sub: 'google-subject-1',
        email: 'camille@example.test',
        email_verified: false,
      }),
    } as never);

    await expect(
      makeService().exchangeCode('one-time-code'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
