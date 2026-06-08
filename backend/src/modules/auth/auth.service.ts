import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service';

import { buildDefaultGoals } from '../goals/default-goals';

import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private async generateAccessToken(
    userId: string,
    email: string,
    role: string,
  ) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
        role,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'access-secret',

        expiresIn: '15m',
      },
    );
  }

  private async generateRefreshToken(
    userId: string,
    email: string,
    role: string,
  ) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
        role,
      },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',

        expiresIn: '7d',
      },
    );
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        refreshToken: hashedRefreshToken,
      },
    });
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email already used');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,

        email: dto.email,

        password: hashedPassword,

        goals: {
          create: buildDefaultGoals(),
        },
      },
    });

    const accessToken = await this.generateAccessToken(
      user.id,
      user.email,
      user.role,
    );

    const refreshToken = await this.generateRefreshToken(
      user.id,
      user.email,
      user.role,
    );

    await this.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,

      refreshToken,

      user: {
        id: user.id,

        firstName: user.firstName,

        email: user.email,

        role: user.role,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Compte bloqué');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const accessToken = await this.generateAccessToken(
      user.id,
      user.email,
      user.role,
    );

    const refreshToken = await this.generateRefreshToken(
      user.id,
      user.email,
      user.role,
    );

    await this.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,

      refreshToken,

      user: {
        id: user.id,

        firstName: user.firstName,

        email: user.email,

        role: user.role,
      },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,

      firstName: user.firstName,

      email: user.email,

      role: user.role,
    };
  }
}
