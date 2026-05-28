import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

import { CreateActivityDto } from "./dto/create-activity.dto";

import { UpdateActivityDto } from "./dto/update-activity.dto";

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    dto: CreateActivityDto,
  ) {
    return this.prisma.activity.create({
      data: {
        ...dto,

        startedAt: new Date(
          dto.startedAt,
        ),

        userId,

        type: "TRAINING",
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.activity.findMany({
      where: {
        userId,
      },

      orderBy: {
        startedAt: "desc",
      },
    });
  }

  async findOne(
    userId: string,
    activityId: string,
  ) {
    const activity =
      await this.prisma.activity.findFirst({
        where: {
          id: activityId,

          userId,
        },
      });

    if (!activity) {
      throw new NotFoundException(
        "Activité introuvable",
      );
    }

    return activity;
  }

  async update(
    userId: string,
    activityId: string,
    dto: UpdateActivityDto,
  ) {
    await this.findOne(
      userId,
      activityId,
    );

    return this.prisma.activity.update({
      where: {
        id: activityId,
      },

      data: {
        ...dto,

        ...(dto.startedAt && {
          startedAt: new Date(
            dto.startedAt,
          ),
        }),
      },
    });
  }

  async remove(
    userId: string,
    activityId: string,
  ) {
    await this.findOne(
      userId,
      activityId,
    );

    await this.prisma.activity.delete({
      where: {
        id: activityId,
      },
    });

    return {
      message:
        "Activité supprimée",
    };
  }
}