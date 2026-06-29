import { HttpException, HttpStatus } from '@nestjs/common';
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

  it('allows the first Strava synchronization attempt', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const findUnique = jest.fn().mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const service = new StravaService(
      {
        stravaConnection: { updateMany, findUnique },
      } as unknown as PrismaService,
      {} as ConfigService,
    );

    await expect(service.syncActivities('user-1')).resolves.toEqual({
      imported: 0,
      fetched: 0,
      latestImportedActivityTitle: null,
    });
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('returns the number and name of newly imported activities', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const findUnique = jest.fn().mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    const findMany = jest.fn().mockResolvedValue([]);
    const upsert = jest.fn().mockResolvedValue({ id: 'activity-1' });
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: 123,
            name: 'Tour du lac',
            type: 'Run',
            distance: 5000,
            elapsed_time: 1800,
            start_date: '2026-06-29T08:00:00.000Z',
          },
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
    const service = new StravaService(
      {
        stravaConnection: { updateMany, findUnique },
        activity: { findMany, upsert },
      } as unknown as PrismaService,
      {} as ConfigService,
    );

    await expect(service.syncActivities('user-1')).resolves.toEqual({
      imported: 1,
      fetched: 1,
      latestImportedActivityTitle: 'Tour du lac',
    });
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it('blocks another Strava synchronization during the cooldown', async () => {
    const lastSyncAttemptAt = new Date();
    const updateMany = jest.fn().mockResolvedValue({ count: 0 });
    const findUnique = jest.fn().mockResolvedValue({ lastSyncAttemptAt });
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new Error('fetch should not be called'));
    const service = new StravaService(
      {
        stravaConnection: { updateMany, findUnique },
      } as unknown as PrismaService,
      {} as ConfigService,
    );

    try {
      await service.syncActivities('user-1');
      throw new Error('Expected synchronization to be rate limited');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
      expect((error as HttpException).getResponse()).toMatchObject({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        retryAfterSeconds: expect.any(Number),
        nextSyncAllowedAt: expect.any(String),
      });
    }

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
