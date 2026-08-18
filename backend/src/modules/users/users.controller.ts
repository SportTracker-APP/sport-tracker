import {
  Body,
  Controller,
  Get,
  Patch,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/authenticated-request.type';

import { UsersService } from './users.service';

import { UpdateProfileDto } from './dto/update-profile.dto';

import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateDiscoveryGeoPreferencesDto } from './dto/update-discovery-geo-preferences.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me/geo-preferences')
  getGeoPreferences(@Req() req: AuthenticatedRequest) {
    return this.usersService.getGeoPreferences(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/geo-preferences/discovery')
  updateDiscoveryGeoPreferences(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateDiscoveryGeoPreferencesDto,
  ) {
    return this.usersService.updateDiscoveryGeoPreferences(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest) {
    const profile = await this.usersService.getProfile(req.user.id);

    return {
      ...profile,
      impersonation: req.user.impersonation ?? null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(
    @Req() req: AuthenticatedRequest,

    @Body()
    dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('password')
  updatePassword(
    @Req() req: AuthenticatedRequest,

    @Body()
    dto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(req.user.id, dto);
  }
}
