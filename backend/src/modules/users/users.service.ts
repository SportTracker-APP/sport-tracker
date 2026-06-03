import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service';

import { UpdateProfileDto } from './dto/update-profile.dto';

import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        firstName: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        ...(dto.firstName && {
          firstName: dto.firstName,
        }),

        ...(dto.avatarUrl && {
          avatarUrl: dto.avatarUrl,
        }),
      },

      select: {
        id: true,
        firstName: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const passwordMatch = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!passwordMatch) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        password: hashedPassword,
      },
    });

    return {
      message: 'Mot de passe mis à jour',
    };
  }
}
