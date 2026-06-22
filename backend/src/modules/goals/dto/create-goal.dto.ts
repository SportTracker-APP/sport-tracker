import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { GoalPeriod, GoalType, SportType } from '@prisma/client';

export class CreateGoalDto {
  @IsString()
  title: string;

  @IsEnum(GoalType)
  type: GoalType;

  @IsOptional()
  @IsEnum(SportType)
  sport?: SportType | null;

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

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
