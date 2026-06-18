import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        title: dto.title,
        type: dto.type,
        sport: dto.sport ?? null,
        target: dto.target,
        period: dto.period,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: dto.isActive ?? true,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.goal.findMany({
      where: {
        userId,
      },
      orderBy: [
        {
          isActive: 'desc',
        },
        {
          endDate: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }

  async update(userId: string, goalId: string, dto: UpdateGoalDto) {
    await this.findOne(userId, goalId);

    return this.prisma.goal.update({
      where: {
        id: goalId,
      },
      data: {
        ...(dto.title !== undefined && {
          title: dto.title,
        }),
        ...(dto.type !== undefined && {
          type: dto.type,
        }),
        ...(dto.sport !== undefined && {
          sport: dto.sport,
        }),
        ...(dto.target !== undefined && {
          target: dto.target,
        }),
        ...(dto.period !== undefined && {
          period: dto.period,
        }),
        ...(dto.startDate !== undefined && {
          startDate: new Date(dto.startDate),
        }),
        ...(dto.endDate !== undefined && {
          endDate: new Date(dto.endDate),
        }),
        ...(dto.isActive !== undefined && {
          isActive: dto.isActive,
        }),
      },
    });
  }

  async remove(userId: string, goalId: string) {
    await this.findOne(userId, goalId);

    return this.prisma.goal.delete({
      where: {
        id: goalId,
      },
    });
  }

  private async findOne(userId: string, goalId: string) {
    const goal = await this.prisma.goal.findFirst({
      where: {
        id: goalId,
        userId,
      },
    });

    if (!goal) {
      throw new NotFoundException('Objectif introuvable');
    }

    return goal;
  }
}
