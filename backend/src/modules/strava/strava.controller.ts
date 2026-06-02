import {
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';

import type { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { StravaService } from './strava.service';

@Controller('strava')
export class StravaController {
  constructor(private readonly stravaService: StravaService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  status(
    @CurrentUser('id')
    userId: string,
  ) {
    return this.stravaService.getStatus(userId);
  }

  @Get('connect')
  @UseGuards(JwtAuthGuard)
  connect(
    @CurrentUser('id')
    userId: string,
  ) {
    return {
      authorizationUrl: this.stravaService.getAuthorizationUrl(userId),
    };
  }

  @Get('callback')
  async callback(
    @Query('code')
    code: string | undefined,

    @Query('state')
    state: string | undefined,

    @Query('error')
    error: string | undefined,

    @Res()
    response: Response,
  ) {
    const redirectUrl = await this.stravaService.handleCallback({
      code,
      state,
      error,
    });

    return response.redirect(redirectUrl);
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  sync(
    @CurrentUser('id')
    userId: string,
  ) {
    return this.stravaService.syncActivities(userId);
  }

  @Delete('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(
    @CurrentUser('id')
    userId: string,
  ) {
    return this.stravaService.disconnect(userId);
  }
}
