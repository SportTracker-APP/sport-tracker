import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { ActivitiesService } from './activities.service';

import { CreateActivityDto } from './dto/create-activity.dto';

import { UpdateActivityDto } from './dto/update-activity.dto';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  create(
    @CurrentUser('id')
    userId: string,

    @Body()
    dto: CreateActivityDto,
  ) {
    return this.activitiesService.create(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('id')
    userId: string,
  ) {
    return this.activitiesService.findAll(userId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('id')
    userId: string,

    @Param('id')
    activityId: string,
  ) {
    return this.activitiesService.findOne(userId, activityId);
  }

  @Patch(':id')
  update(
    @CurrentUser('id')
    userId: string,

    @Param('id')
    activityId: string,

    @Body()
    dto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(userId, activityId, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser('id')
    userId: string,

    @Param('id')
    activityId: string,
  ) {
    return this.activitiesService.remove(userId, activityId);
  }
}
