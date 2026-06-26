import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/prisma.service';

import { StravaService } from './strava.service';

describe('StravaService security', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects invalid OAuth state without exchanging the authorization code', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new Error('fetch should not be called'));
    const service = new StravaService(
      {} as unknown as PrismaService,
      {
        get: jest.fn((key: string) => {
          const values: Record<string, string> = {
            FRONTEND_URL: 'http://localhost:3000',
            STRAVA_STATE_SECRET: 'test-strava-state-secret',
          };

          return values[key];
        }),
        getOrThrow: jest.fn((key: string) => {
          const values: Record<string, string> = {
            STRAVA_STATE_SECRET: 'test-strava-state-secret',
          };
          const value = values[key];

          if (!value) {
            throw new Error(`${key} missing`);
          }

          return value;
        }),
      } as unknown as ConfigService,
    );

    await expect(
      service.handleCallback({
        code: 'oauth-code',
        state: 'invalid-state',
      }),
    ).resolves.toBe(
      'http://localhost:3000/integrations/strava?strava=error&reason=state_invalid',
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
