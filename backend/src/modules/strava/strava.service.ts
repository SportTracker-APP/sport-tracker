import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import {
  ActivityStatus,
  ActivityType,
  Prisma,
  SportType,
} from '@prisma/client';

import { createHmac, randomBytes } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';

interface StravaStatePayload {
  userId: string;
  expiresAt: number;
  nonce: string;
  signature: string;
}

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {
    id: number;
  };
}

interface StravaRefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type?: string;
  distance: number;
  moving_time?: number;
  elapsed_time: number;
  total_elevation_gain?: number;
  start_date: string;
  average_speed?: number;
  max_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
  kilojoules?: number;
  description?: string;
}

type StravaCallbackFailureReason =
  | 'state_invalid'
  | 'token_exchange_failed'
  | 'token_payload_invalid'
  | 'database_error'
  | 'unknown';

@Injectable()
export class StravaService {
  private readonly authorizationEndpoint =
    'https://www.strava.com/oauth/authorize';

  private readonly tokenEndpoint = 'https://www.strava.com/oauth/token';

  private readonly activitiesEndpoint =
    'https://www.strava.com/api/v3/athlete/activities';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getStatus(userId: string) {
    const connection = await this.prisma.stravaConnection.findUnique({
      where: {
        userId,
      },
      select: {
        athleteId: true,
        expiresAt: true,
        updatedAt: true,
      },
    });

    if (!connection) {
      return {
        connected: false,
      };
    }

    return {
      connected: true,
      athleteId: connection.athleteId,
      expiresAt: connection.expiresAt,
      lastUpdatedAt: connection.updatedAt,
    };
  }

  getAuthorizationUrl(userId: string) {
    const clientId = this.getRequiredConfig('STRAVA_CLIENT_ID');

    const redirectUri = this.getStravaCallbackUrl();

    const authorizationUrl = new URL(this.authorizationEndpoint);

    authorizationUrl.searchParams.set('client_id', clientId);
    authorizationUrl.searchParams.set('response_type', 'code');
    authorizationUrl.searchParams.set('redirect_uri', redirectUri);
    authorizationUrl.searchParams.set('approval_prompt', 'auto');
    authorizationUrl.searchParams.set('scope', 'read,activity:read_all');
    authorizationUrl.searchParams.set('state', this.createState(userId));

    return authorizationUrl.toString();
  }

  async handleCallback(params: {
    code?: string;
    state?: string;
    error?: string;
  }) {
    const frontendUrl = this.getFrontendUrl();

    if (params.error) {
      return `${frontendUrl}/integrations/strava?strava=denied`;
    }

    if (!params.code || !params.state) {
      return `${frontendUrl}/integrations/strava?strava=invalid`;
    }

    let state: StravaStatePayload;

    try {
      state = this.verifyState(params.state);
    } catch (error) {
      this.logCallbackError('state_invalid', error);

      return `${frontendUrl}/integrations/strava?strava=error&reason=state_invalid`;
    }

    let tokenResponse: StravaTokenResponse;

    try {
      tokenResponse = await this.exchangeAuthorizationCode(params.code);
    } catch (error) {
      this.logCallbackError('token_exchange_failed', error);

      return `${frontendUrl}/integrations/strava?strava=error&reason=token_exchange_failed`;
    }

    if (!tokenResponse.athlete?.id) {
      this.logCallbackError(
        'token_payload_invalid',
        new Error('Missing athlete id in Strava token response'),
      );

      return `${frontendUrl}/integrations/strava?strava=error&reason=token_payload_invalid`;
    }

    try {
      await this.prisma.stravaConnection.upsert({
        where: {
          userId: state.userId,
        },
        create: {
          userId: state.userId,
          athleteId: tokenResponse.athlete.id.toString(),
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt: new Date(tokenResponse.expires_at * 1000),
        },
        update: {
          athleteId: tokenResponse.athlete.id.toString(),
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt: new Date(tokenResponse.expires_at * 1000),
        },
      });

      return `${frontendUrl}/integrations/strava?strava=connected`;
    } catch (error) {
      this.logCallbackError('database_error', error);

      return `${frontendUrl}/integrations/strava?strava=error&reason=database_error`;
    }
  }

  async syncActivities(userId: string) {
    const connection = await this.getValidConnection(userId);

    let activities: StravaActivity[];

    try {
      activities = await this.fetchActivities(connection.accessToken);
    } catch (error) {
      console.error('Strava sync list failed:', {
        message: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }

    if (activities.length === 0) {
      return {
        imported: 0,
        fetched: 0,
      };
    }

    const existingActivities = await this.prisma.activity.findMany({
      where: {
        userId,
        stravaActivityId: {
          in: activities.map((activity) => activity.id.toString()),
        },
      },
      select: {
        stravaActivityId: true,
      },
    });

    const existingActivitiesByStravaId = new Map(
      existingActivities
        .filter((activity) => activity.stravaActivityId)
        .map((activity) => [activity.stravaActivityId as string, activity]),
    );

    try {
      for (const activity of activities) {
        const mappedActivity = this.mapActivity(userId, activity);
        const stravaActivityId = mappedActivity.stravaActivityId;

        if (!stravaActivityId) {
          continue;
        }

        await this.prisma.activity.upsert({
          where: {
            stravaActivityId,
          },
          create: mappedActivity,
          update: {
            title: mappedActivity.title,
            description: mappedActivity.description,
            type: mappedActivity.type,
            sport: mappedActivity.sport,
            status: mappedActivity.status,
            distance: mappedActivity.distance,
            duration: mappedActivity.duration,
            movingTime: mappedActivity.movingTime,
            elevationGain: mappedActivity.elevationGain,
            calories: mappedActivity.calories,
            averageSpeed: mappedActivity.averageSpeed,
            maxSpeed: mappedActivity.maxSpeed,
            averageHeartRate: mappedActivity.averageHeartRate,
            maxHeartRate: mappedActivity.maxHeartRate,
            startedAt: mappedActivity.startedAt,
          },
        });
      }
    } catch (error) {
      console.error('Strava sync database failed:', {
        message: error instanceof Error ? error.message : String(error),
      });

      throw new BadRequestException(
        "L'import en base a échoué pendant la synchronisation Strava.",
      );
    }

    return {
      imported: activities.filter(
        (activity) => !existingActivitiesByStravaId.has(activity.id.toString()),
      ).length,
      fetched: activities.length,
    };
  }

  async disconnect(userId: string) {
    await this.prisma.stravaConnection.deleteMany({
      where: {
        userId,
      },
    });

    return {
      connected: false,
    };
  }

  private async getValidConnection(userId: string) {
    const connection = await this.prisma.stravaConnection.findUnique({
      where: {
        userId,
      },
    });

    if (!connection) {
      throw new NotFoundException('Aucun compte Strava connecté');
    }

    const expiresSoon = connection.expiresAt.getTime() <= Date.now() + 60_000;

    if (!expiresSoon) {
      return connection;
    }

    const refreshed = await this.refreshAccessToken(connection.refreshToken);

    return this.prisma.stravaConnection.update({
      where: {
        userId,
      },
      data: {
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        expiresAt: new Date(refreshed.expires_at * 1000),
      },
    });
  }

  private async exchangeAuthorizationCode(code: string) {
    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      body: new URLSearchParams({
        client_id: this.getRequiredConfig('STRAVA_CLIENT_ID'),
        client_secret: this.getRequiredConfig('STRAVA_CLIENT_SECRET'),
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new BadRequestException(
        `Connexion Strava refusée (${response.status})`,
      );
    }

    return response.json() as Promise<StravaTokenResponse>;
  }

  private async refreshAccessToken(refreshToken: string) {
    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      body: new URLSearchParams({
        client_id: this.getRequiredConfig('STRAVA_CLIENT_ID'),
        client_secret: this.getRequiredConfig('STRAVA_CLIENT_SECRET'),
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new BadRequestException('Token Strava invalide');
    }

    return response.json() as Promise<StravaRefreshResponse>;
  }

  private async fetchActivities(accessToken: string) {
    const activities: StravaActivity[] = [];
    const perPage = 100;
    const maxPages = 10;

    for (let page = 1; page <= maxPages; page += 1) {
      const url = new URL(this.activitiesEndpoint);

      url.searchParams.set('page', page.toString());
      url.searchParams.set('per_page', perPage.toString());

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw this.createStravaApiException(
          response.status,
          'Impossible de récupérer les activités Strava.',
        );
      }

      const pageActivities = (await response.json()) as StravaActivity[];

      activities.push(...pageActivities);

      if (pageActivities.length < perPage) {
        break;
      }
    }

    return activities;
  }

  private createStravaApiException(status: number, fallbackMessage: string) {
    if (status === 429) {
      return new HttpException(
        'Limite API Strava atteinte. Réessayez plus tard.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (status === 401) {
      return new BadRequestException(
        'Le token Strava est invalide. Reconnectez votre compte Strava.',
      );
    }

    return new BadRequestException(`${fallbackMessage} (${status})`);
  }

  private mapActivity(
    userId: string,
    activity: StravaActivity,
  ): Prisma.ActivityCreateManyInput {
    const sport = this.mapSportType(activity.sport_type || activity.type);

    const durationMinutes = Math.max(1, Math.round(activity.elapsed_time / 60));

    const distanceKm =
      activity.distance > 0 ? activity.distance / 1000 : undefined;

    return {
      userId,
      stravaActivityId: activity.id.toString(),
      title: activity.name,
      description: activity.description,
      type:
        sport === SportType.WALKING ? ActivityType.WALK : ActivityType.TRAINING,
      sport,
      status: ActivityStatus.COMPLETED,
      distance: distanceKm,
      duration: durationMinutes,
      movingTime: activity.moving_time,
      elevationGain:
        activity.total_elevation_gain !== undefined
          ? Math.round(activity.total_elevation_gain)
          : undefined,
      calories: this.mapCalories(activity),
      averageSpeed: activity.average_speed,
      maxSpeed: activity.max_speed,
      averageHeartRate:
        activity.average_heartrate !== undefined
          ? Math.round(activity.average_heartrate)
          : undefined,
      maxHeartRate:
        activity.max_heartrate !== undefined
          ? Math.round(activity.max_heartrate)
          : undefined,
      startedAt: new Date(activity.start_date),
    };
  }

  private mapSportType(stravaType: string): SportType {
    const sportMap: Record<string, SportType> = {
      Run: SportType.RUNNING,
      TrailRun: SportType.TRAIL,
      Ride: SportType.ROAD_CYCLING,
      MountainBikeRide: SportType.MTB,
      GravelRide: SportType.GRAVEL,
      Hike: SportType.HIKING,
      Walk: SportType.WALKING,
      Swim: SportType.SWIMMING,
      AlpineSki: SportType.SKI,
      BackcountrySki: SportType.SKI,
      Snowboard: SportType.SNOWBOARD,
      WeightTraining: SportType.GYM,
      Workout: SportType.FITNESS,
    };

    return sportMap[stravaType] || SportType.RUNNING;
  }

  private mapCalories(activity: StravaActivity) {
    if (activity.calories !== undefined) {
      return Math.round(activity.calories);
    }

    if (activity.kilojoules !== undefined) {
      return Math.round(activity.kilojoules * 0.239006);
    }

    return undefined;
  }

  private createState(userId: string) {
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const nonce = randomBytes(16).toString('hex');
    const signature = this.signState(userId, expiresAt, nonce);

    const payload: StravaStatePayload = {
      userId,
      expiresAt,
      nonce,
      signature,
    };

    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  }

  private verifyState(encodedState: string) {
    const payload = JSON.parse(
      Buffer.from(encodedState, 'base64url').toString('utf8'),
    ) as StravaStatePayload;

    if (payload.expiresAt < Date.now()) {
      throw new BadRequestException('Lien Strava expiré');
    }

    const expectedSignature = this.signState(
      payload.userId,
      payload.expiresAt,
      payload.nonce,
    );

    if (payload.signature !== expectedSignature) {
      throw new BadRequestException('Signature Strava invalide');
    }

    return payload;
  }

  private signState(userId: string, expiresAt: number, nonce: string) {
    return createHmac('sha256', this.getStateSecret())
      .update(`${userId}.${expiresAt}.${nonce}`)
      .digest('hex');
  }

  private getRequiredConfig(key: string) {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new InternalServerErrorException(`${key} est manquant`);
    }

    return value;
  }

  private getStateSecret() {
    return (
      this.configService.get<string>('STRAVA_STATE_SECRET') ||
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'strava-state-secret'
    );
  }

  private getStravaCallbackUrl() {
    return (
      this.configService.get<string>('STRAVA_CALLBACK_URL') ||
      'http://localhost:4000/strava/callback'
    );
  }

  private getFrontendUrl() {
    return (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'
    );
  }

  private logCallbackError(
    reason: StravaCallbackFailureReason,
    error: unknown,
  ) {
    console.error('Strava callback failed:', {
      reason,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
