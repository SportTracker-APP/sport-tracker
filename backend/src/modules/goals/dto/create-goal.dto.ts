import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { GoalPeriod, GoalType } from '@prisma/client';

export class CreateGoalDto {
  @IsString()
  title: string;

  @IsEnum(GoalType)
  type: GoalType;

  @IsNumber()
  @Min(1)
  target: number;

  @IsEnum(GoalPeriod)
  period: GoalPeriod;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
