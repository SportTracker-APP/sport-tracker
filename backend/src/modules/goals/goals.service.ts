import { Injectable, NotFoundException } from '@nestjs/common';
import { Goal, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

const goalSelectWithoutPrimary = {
  id: true,
  title: true,
  type: true,
  sport: true,
  target: true,
  period: true,
  startDate: true,
  endDate: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
} as const satisfies Prisma.GoalSelect;

type GoalWithoutPrimary = Prisma.GoalGetPayload<{
  select: typeof goalSelectWithoutPrimary;
}>;

function isMissingPrimaryGoalColumn(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code =
    'code' in error && typeof error.code === 'string' ? error.code : undefined;
  const message =
    error instanceof Error ? error.message : (JSON.stringify(error) ?? '');

  return code === 'P2022' && message.includes('isPrimary');
}

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateGoalDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.isPrimary) {
          await tx.goal.updateMany({
            where: {
              userId,
            },
            data: {
              isPrimary: false,
            },
          });
        }

        return tx.goal.create({
          data: {
            title: dto.title,
            type: dto.type,
            sport: dto.sport ?? null,
            target: dto.target,
            period: dto.period,
            startDate: new Date(dto.startDate),
            endDate: new Date(dto.endDate),
            isActive: dto.isActive ?? true,
            isPrimary: dto.isPrimary ?? false,
            userId,
          },
        });
      });
    } catch (error) {
      if (!isMissingPrimaryGoalColumn(error)) {
        throw error;
      }

      const goal = await this.prisma.goal.create({
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
        select: goalSelectWithoutPrimary,
      });

      return {
        ...goal,
        isPrimary: false,
      };
    }
  }

  async findAll(userId: string) {
    try {
      return await this.prisma.goal.findMany({
        where: {
          userId,
        },
        orderBy: [
          {
            isPrimary: 'desc',
          },
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
    } catch (error) {
      if (!isMissingPrimaryGoalColumn(error)) {
        throw error;
      }

      const goals = await this.prisma.goal.findMany({
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
        select: goalSelectWithoutPrimary,
      });

      return goals.map((goal) => ({
        ...goal,
        isPrimary: false,
      }));
    }
  }

  async update(userId: string, goalId: string, dto: UpdateGoalDto) {
    await this.findOne(userId, goalId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.isPrimary) {
          await tx.goal.updateMany({
            where: {
              userId,
              id: {
                not: goalId,
              },
            },
            data: {
              isPrimary: false,
            },
          });
        }

        return tx.goal.update({
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
            ...(dto.isPrimary !== undefined && {
              isPrimary: dto.isPrimary,
            }),
          },
        });
      });
    } catch (error) {
      if (!isMissingPrimaryGoalColumn(error)) {
        throw error;
      }

      const goal = await this.prisma.goal.update({
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
        select: goalSelectWithoutPrimary,
      });

      return {
        ...goal,
        isPrimary: false,
      };
    }
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
    let goal: Goal | GoalWithoutPrimary | null;

    try {
      goal = await this.prisma.goal.findFirst({
        where: {
          id: goalId,
          userId,
        },
      });
    } catch (error) {
      if (!isMissingPrimaryGoalColumn(error)) {
        throw error;
      }

      goal = await this.prisma.goal.findFirst({
        where: {
          id: goalId,
          userId,
        },
        select: goalSelectWithoutPrimary,
      });
    }

    if (!goal) {
      throw new NotFoundException('Objectif introuvable');
    }

    return {
      ...goal,
      isPrimary: 'isPrimary' in goal ? goal.isPrimary : false,
    };
  }
}
