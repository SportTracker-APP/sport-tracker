import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../../prisma/prisma.module';

import { AdminController } from './admin.controller';
import { AdminImpersonationController } from './admin-impersonation.controller';

import { AdminService } from './admin.service';
import { AdminImpersonationService } from './admin-impersonation.service';

import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [AdminController, AdminImpersonationController],
  providers: [AdminService, AdminImpersonationService, AdminGuard],
})
export class AdminModule {}
