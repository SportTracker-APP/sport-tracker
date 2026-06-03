import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserPasswordDto } from './dto/update-admin-user-password.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { AdminGuard } from './guards/admin.guard';

import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  getMetrics() {
    return this.adminService.getMetrics();
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Post('users')
  createUser(@Body() dto: CreateAdminUserDto) {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id')
  updateUser(
    @Req() req: { user: { id: string } },
    @Param('id') userId: string,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.adminService.updateUser(req.user.id, userId, dto);
  }

  @Patch('users/:id/password')
  updateUserPassword(
    @Param('id') userId: string,
    @Body() dto: UpdateAdminUserPasswordDto,
  ) {
    return this.adminService.updateUserPassword(userId, dto);
  }
}
