import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { AuthenticatedRequest } from '../auth/authenticated-request.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { AdminImpersonationService } from './admin-impersonation.service';
import { AdminGuard } from './guards/admin.guard';

@Controller('admin')
export class AdminImpersonationController {
  constructor(
    private readonly impersonationService: AdminImpersonationService,
  ) {}

  @Post('users/:id/impersonate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, AdminGuard)
  start(
    @Req() request: AuthenticatedRequest,
    @Param('id') targetUserId: string,
  ) {
    return this.impersonationService.start(request.user.id, targetUserId, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });
  }

  @Post('impersonation/stop')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  stop(@Req() request: AuthenticatedRequest) {
    return this.impersonationService.stop(
      request.user.id,
      request.user.impersonation,
    );
  }
}
