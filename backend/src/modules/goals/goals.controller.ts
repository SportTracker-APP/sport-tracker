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

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateGoalDto } from './dto/create-goal.dto';

import { UpdateGoalDto } from './dto/update-goal.dto';

import { GoalsService } from './goals.service';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.goalsService.findAll(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') goalId: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.update(userId, goalId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') goalId: string) {
    return this.goalsService.remove(userId, goalId);
  }
}
