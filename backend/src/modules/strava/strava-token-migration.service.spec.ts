import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/prisma.service';

import { StravaTokenEncryptionService } from './strava-token-encryption.service';
import { StravaTokenMigrationService } from './strava-token-migration.service';

describe('StravaTokenMigrationService', () => {
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
});
