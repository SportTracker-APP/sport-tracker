import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../../prisma/prisma.module';
import { GeographyModule } from '../geography/geography.module';

import { AdminController } from './admin.controller';
import { AdminImpersonationController } from './admin-impersonation.controller';
import { AdminSummitsController } from './admin-summits.controller';

import { AdminService } from './admin.service';
import { AdminImpersonationService } from './admin-impersonation.service';
import { AdminSummitsService } from './admin-summits.service';

import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [PrismaModule, GeographyModule, JwtModule.register({})],
  controllers: [
    AdminController,
    AdminImpersonationController,
    AdminSummitsController,
  ],
  providers: [
    AdminService,
    AdminImpersonationService,
    AdminSummitsService,
    AdminGuard,
  ],
})
export class AdminModule {}
