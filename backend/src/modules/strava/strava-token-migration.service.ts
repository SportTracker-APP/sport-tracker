import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/prisma.service';

import { StravaTokenEncryptionService } from './strava-token-encryption.service';

@Injectable()
export class StravaTokenMigrationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StravaTokenMigrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly tokenEncryption: StravaTokenEncryptionService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.tokenEncryption.isConfigured()) {
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        throw new Error(
          'STRAVA_TOKEN_ENCRYPTION_KEYS is required in production',
        );
      }

      this.logger.warn({
        message:
          'Strava token encryption is not configured; Strava operations are disabled',
      });
      return;
    }

    const connections = await this.prisma.stravaConnection.findMany({
      select: {
        id: true,
        userId: true,
        accessToken: true,
        refreshToken: true,
      },
    });
    let migratedConnections = 0;

    for (const connection of connections) {
      const accessToken = this.tokenEncryption.reencryptIfNeeded(
        connection.accessToken,
        { userId: connection.userId, tokenType: 'access' },
      );
      const refreshToken = this.tokenEncryption.reencryptIfNeeded(
        connection.refreshToken,
        { userId: connection.userId, tokenType: 'refresh' },
      );

      if (
        accessToken === connection.accessToken &&
        refreshToken === connection.refreshToken
      ) {
        continue;
      }

      const result = await this.prisma.stravaConnection.updateMany({
        where: {
          id: connection.id,
          accessToken: connection.accessToken,
          refreshToken: connection.refreshToken,
        },
        data: {
          accessToken,
          refreshToken,
        },
      });

      migratedConnections += result.count;
    }

    if (migratedConnections > 0) {
      this.logger.log({
        migratedConnections,
        message: 'Strava tokens encrypted or rotated successfully',
      });
    }
  }
}
