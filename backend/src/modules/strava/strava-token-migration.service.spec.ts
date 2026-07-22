import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/prisma.service';

import { StravaTokenEncryptionService } from './strava-token-encryption.service';
import { StravaTokenMigrationService } from './strava-token-migration.service';

describe('StravaTokenMigrationService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('replaces legacy plaintext tokens without logging their values', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'connection-1',
        userId: 'user-1',
        accessToken: 'legacy-access-token',
        refreshToken: 'legacy-refresh-token',
      },
    ]);
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const tokenEncryption = {
      isConfigured: jest.fn().mockReturnValue(true),
      reencryptIfNeeded: jest.fn((token: string) => `encrypted:${token}`),
    } as unknown as StravaTokenEncryptionService;
    const service = new StravaTokenMigrationService(
      {
        stravaConnection: { findMany, updateMany },
      } as unknown as PrismaService,
      {} as ConfigService,
      tokenEncryption,
    );

    await service.onApplicationBootstrap();

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: 'connection-1',
        accessToken: 'legacy-access-token',
        refreshToken: 'legacy-refresh-token',
      },
      data: {
        accessToken: 'encrypted:legacy-access-token',
        refreshToken: 'encrypted:legacy-refresh-token',
      },
    });
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain(
      'legacy-access-token',
    );
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain(
      'legacy-refresh-token',
    );
  });

  it('skips credentials that cannot be decrypted without blocking startup', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'broken-connection',
        userId: 'user-with-broken-token',
        accessToken: 'broken-access-token',
        refreshToken: 'broken-refresh-token',
      },
      {
        id: 'healthy-connection',
        userId: 'user-with-healthy-token',
        accessToken: 'legacy-access-token',
        refreshToken: 'legacy-refresh-token',
      },
    ]);
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const tokenEncryption = {
      isConfigured: jest.fn().mockReturnValue(true),
      reencryptIfNeeded: jest.fn(
        (
          token: string,
          context: { userId: string; tokenType: 'access' | 'refresh' },
        ) => {
          if (context.userId === 'user-with-broken-token') {
            throw new Error('decrypt failed');
          }

          return `encrypted:${token}`;
        },
      ),
    } as unknown as StravaTokenEncryptionService;
    const service = new StravaTokenMigrationService(
      {
        stravaConnection: { findMany, updateMany },
      } as unknown as PrismaService,
      {} as ConfigService,
      tokenEncryption,
    );

    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();

    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: 'healthy-connection',
        accessToken: 'legacy-access-token',
        refreshToken: 'legacy-refresh-token',
      },
      data: {
        accessToken: 'encrypted:legacy-access-token',
        refreshToken: 'encrypted:legacy-refresh-token',
      },
    });
    expect(JSON.stringify(warnSpy.mock.calls)).toContain('broken-connection');
    expect(JSON.stringify(warnSpy.mock.calls)).toContain(
      'user-with-broken-token',
    );
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(
      'broken-access-token',
    );
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(
      'broken-refresh-token',
    );
  });
});
