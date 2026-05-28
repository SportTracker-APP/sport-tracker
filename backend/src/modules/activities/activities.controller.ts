import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

import { ActivitiesService } from "./activities.service";

import { CreateActivityDto } from "./dto/create-activity.dto";

import { UpdateActivityDto } from "./dto/update-activity.dto";

@Controller("activities")
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
  ) {}

  @Post()
  create(
    @Req() req: any,

    @Body()
    dto: CreateActivityDto,
  ) {
    return this.activitiesService.create(
      req.user.id,
      dto,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.activitiesService.findAll(
      req.user.id,
    );
  }

  @Get(":id")
  findOne(
    @Req() req: any,

    @Param("id")
    id: string,
  ) {
    return this.activitiesService.findOne(
      req.user.id,
      id,
    );
  }

  @Patch(":id")
  update(
    @Req() req: any,

    @Param("id")
    id: string,

    @Body()
    dto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(
      req.user.id,
      id,
      dto,
    );
  }

  @Delete(":id")
  remove(
    @Req() req: any,

    @Param("id")
    id: string,
  ) {
    return this.activitiesService.remove(
      req.user.id,
      id,
    );
  }
}