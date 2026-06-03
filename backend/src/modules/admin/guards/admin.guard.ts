import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Accès administrateur requis');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        role: true,
        isBlocked: true,
      },
    });

    if (user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Accès administrateur requis');
    }

    if (user.isBlocked) {
      throw new ForbiddenException('Compte bloqué');
    }

    return true;
  }
}
