import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/prisma.service';
import { SummitsService } from '../summits/summits.service';

import { StravaService } from './strava.service';
import { StravaTokenEncryptionService } from './strava-token-encryption.service';

function createTokenEncryptionMock(): StravaTokenEncryptionService {
  return {
    encrypt: jest.fn((token: string) => `encrypted:${token}`),
    decrypt: jest.fn((token: string) => token),
  } as unknown as StravaTokenEncryptionService;
}

describe('StravaService security', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reports an unreadable Strava connection as requiring reconnection', async () => {
    const decrypt = jest.fn().mockImplementation(() => {
      throw new Error('Unreadable encrypted token');
    });
    const service = new StravaService(
      {
        stravaConnection: {
          findUnique: jest.fn().mockResolvedValue({
            athleteId: 'athlete-1',
            accessToken: 'encrypted-access-token',
            refreshToken: 'encrypted-refresh-token',
            expiresAt: new Date('2026-07-27T18:00:00.000Z'),
            updatedAt: new Date('2026-07-27T17:00:00.000Z'),
            lastSyncAttemptAt: null,
          }),
        },
        activity: {
          count: jest.fn().mockResolvedValue(42),
        },
      } as unknown as PrismaService,
      {} as ConfigService,
      { processActivities: jest.fn() } as unknown as SummitsService,
      {
        decrypt,
      } as unknown as StravaTokenEncryptionService,
    );

    await expect(service.getStatus('user-1')).resolves.toEqual({
      connected: false,
      requiresReconnect: true,
      syncedActivitiesCount: 42,
      hasSyncedActivities: true,
    });
    expect(decrypt).toHaveBeenCalledWith('encrypted-access-token', {
      userId: 'user-1',
      tokenType: 'access',
    });
  });

  it('reports a readable Strava connection as connected', async () => {
    const updatedAt = new Date('2026-07-27T17:00:00.000Z');
    const expiresAt = new Date('2026-07-27T18:00:00.000Z');
    const decrypt = jest.fn((token: string) => token);
    const service = new StravaService(
      {
        stravaConnection: {
          findUnique: jest.fn().mockResolvedValue({
            athleteId: 'athlete-1',
            accessToken: 'encrypted-access-token',
            refreshToken: 'encrypted-refresh-token',
            expiresAt,
            updatedAt,
            lastSyncAttemptAt: null,
          }),
        },
        activity: {
          count: jest.fn().mockResolvedValue(42),
        },
      } as unknown as PrismaService,
      {} as ConfigService,
      { processActivities: jest.fn() } as unknown as SummitsService,
      {
        decrypt,
      } as unknown as StravaTokenEncryptionService,
    );

    await expect(service.getStatus('user-1')).resolves.toMatchObject({
      connected: true,
      requiresReconnect: false,
      athleteId: 'athlete-1',
      expiresAt,
      lastUpdatedAt: updatedAt,
      syncedActivitiesCount: 42,
      hasSyncedActivities: true,
    });
    expect(decrypt).toHaveBeenCalledTimes(2);
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
      { processActivities: jest.fn() } as unknown as SummitsService,
      createTokenEncryptionMock(),
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
      { processActivities: jest.fn() } as unknown as SummitsService,
      createTokenEncryptionMock(),
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
      {
        processActivities: jest.fn().mockResolvedValue(undefined),
      } as unknown as SummitsService,
      createTokenEncryptionMock(),
    );

    await expect(service.syncActivities('user-1')).resolves.toEqual({
      imported: 1,
      fetched: 1,
      latestImportedActivityTitle: 'Tour du lac',
    });
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it('retries summit detection after reconnecting an already persisted activity', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const findUnique = jest.fn().mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    const findMany = jest.fn().mockResolvedValue([
      {
        stravaActivityId: '123',
        coverImageUrl: 'https://example.test/velan.jpg',
        title: 'Test terrain du Vélan',
        maxAltitude: 1020,
        routePolyline: '????????',
        summitDetectionProcessedAt: null,
        summitDetectionVersion: 0,
      },
    ]);
    const upsert = jest.fn().mockResolvedValue({ id: 'activity-velan' });
    const processActivities = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: 123,
            name: 'Test terrain du Vélan',
            type: 'Hike',
            distance: 8000,
            elapsed_time: 3600,
            elev_high: 1020,
            map: { summary_polyline: '????????' },
            start_date: '2026-08-28T06:15:00.000Z',
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
      { processActivities } as unknown as SummitsService,
      createTokenEncryptionMock(),
    );

    await expect(service.syncActivities('user-1')).resolves.toEqual({
      imported: 0,
      fetched: 1,
      latestImportedActivityTitle: null,
    });
    expect(processActivities).toHaveBeenCalledWith('user-1', [
      'activity-velan',
    ]);
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
      { processActivities: jest.fn() } as unknown as SummitsService,
      createTokenEncryptionMock(),
    );

    try {
      await service.syncActivities('user-1');
      throw new Error('Expected synchronization to be rate limited');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
      const response = (error as HttpException).getResponse() as {
        statusCode: number;
        retryAfterSeconds: number;
        nextSyncAllowedAt: string;
      };

      expect(response.statusCode).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(typeof response.retryAfterSeconds).toBe('number');
      expect(typeof response.nextSyncAllowedAt).toBe('string');
    }

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('keeps the altitude stream when Strava activity details are unavailable', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      await Promise.resolve();
      const url = input instanceof Request ? input.url : input.toString();

      if (url.includes('/streams')) {
        return new Response(
          JSON.stringify({
            altitude: { data: ['412', 438, 493] },
            distance: { data: [0, '3500', 7100] },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      return new Response(JSON.stringify({ message: 'details unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const service = new StravaService(
      {
        stravaConnection: {
          findUnique: jest.fn().mockResolvedValue({
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          }),
        },
      } as unknown as PrismaService,
      {} as ConfigService,
      { processActivities: jest.fn() } as unknown as SummitsService,
      createTokenEncryptionMock(),
    );

    await expect(
      service.getActivityEnrichment('user-1', '123'),
    ).resolves.toMatchObject({
      altitudeStream: [412, 438, 493],
      distanceStream: [0, 3500, 7100],
      photoUrls: [],
      coverImageUrl: null,
    });
  });

  it('retries the altitude stream once after a temporary Strava failure', async () => {
    let streamAttempts = 0;

    jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      await Promise.resolve();
      const url = input instanceof Request ? input.url : input.toString();

      if (url.includes('/streams')) {
        streamAttempts += 1;

        if (streamAttempts === 1) {
          return new Response(JSON.stringify({ message: 'temporary error' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(
          JSON.stringify({
            altitude: { data: [335, 382, 433] },
            distance: { data: [0, 9_000, 18_100] },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      return new Response(JSON.stringify({ elev_low: 335, elev_high: 433 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const service = new StravaService(
      {
        stravaConnection: {
          findUnique: jest.fn().mockResolvedValue({
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          }),
        },
      } as unknown as PrismaService,
      {} as ConfigService,
      { processActivities: jest.fn() } as unknown as SummitsService,
      createTokenEncryptionMock(),
    );

    await expect(
      service.getActivityEnrichment('user-1', '123'),
    ).resolves.toMatchObject({
      altitudeStream: [335, 382, 433],
      distanceStream: [0, 9000, 18100],
    });
    expect(streamAttempts).toBe(2);
  });
});
