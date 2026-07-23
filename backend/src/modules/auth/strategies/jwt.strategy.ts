import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PassportStrategy } from '@nestjs/passport';

import { UserRole } from '@prisma/client';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../../prisma/prisma.service';

type AccessTokenPayload = {
  sub: string;
  email: string;
  role?: string;
  impersonating?: boolean;
  actorId?: string;
  actorEmail?: string;
  actorFirstName?: string;
  impersonationSessionId?: string;
  impersonationExpiresAt?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),

      algorithms: ['HS256'],
    });
  }

  async validate(payload: AccessTokenPayload) {
    if (!payload.impersonating) {
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    }

    if (
      !payload.actorId ||
      !payload.actorEmail ||
      !payload.actorFirstName ||
      !payload.impersonationSessionId ||
      !payload.impersonationExpiresAt
    ) {
      throw new UnauthorizedException('Session administrateur incomplète');
    }

    const [session, admin, target] = await Promise.all([
      this.prisma.adminImpersonationSession.findUnique({
        where: {
          id: payload.impersonationSessionId,
        },
      }),
      this.prisma.user.findUnique({
        where: {
          id: payload.actorId,
        },
        select: {
          role: true,
          isBlocked: true,
        },
      }),
      this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
        select: {
          email: true,
          role: true,
          isBlocked: true,
        },
      }),
    ]);

    const now = new Date();

    if (
      !session ||
      session.endedAt ||
      session.expiresAt <= now ||
      session.adminUserId !== payload.actorId ||
      session.targetUserId !== payload.sub ||
      admin?.role !== UserRole.ADMIN ||
      admin.isBlocked ||
      !target ||
      target.isBlocked ||
      target.role === UserRole.ADMIN
    ) {
      throw new UnauthorizedException('Session administrateur expirée');
    }

    return {
      id: payload.sub,
      email: target.email,
      role: target.role,
      impersonation: {
        sessionId: session.id,
        adminId: payload.actorId,
        adminEmail: payload.actorEmail,
        adminFirstName: payload.actorFirstName,
        expiresAt: session.expiresAt.toISOString(),
      },
    };
  }
}
