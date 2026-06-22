import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export enum SportType {
  RUNNING = 'RUNNING',
  TRAIL = 'TRAIL',
  HIKING = 'HIKING',
  WALKING = 'WALKING',
  ROAD_CYCLING = 'ROAD_CYCLING',
  MTB = 'MTB',
  GRAVEL = 'GRAVEL',
  SWIMMING = 'SWIMMING',
  GYM = 'GYM',
  FITNESS = 'FITNESS',
  SKI = 'SKI',
  SNOWBOARD = 'SNOWBOARD',
  CLIMBING = 'CLIMBING',
}

export enum ActivityType {
  TRAINING = 'TRAINING',
  RACE = 'RACE',
  RECOVERY = 'RECOVERY',
  WALK = 'WALK',
}

export enum ActivityStatus {
  PLANNED = 'PLANNED',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
  CANCELED = 'CANCELED',
}

export class CreateActivityDto {
  @IsEnum(ActivityType)
  type: ActivityType;

  @IsEnum(SportType)
  sport: SportType;

  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distance?: number;

  @IsNumber()
  @Min(0)
  duration: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  elevationGain?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAltitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  calories?: number;

  @IsOptional()
  @IsNumber()
  averageSpeed?: number;

  @IsOptional()
  @IsNumber()
  maxSpeed?: number;

  @IsOptional()
  @IsNumber()
  averageHeartRate?: number;

  @IsOptional()
  @IsNumber()
  maxHeartRate?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsDateString()
  startedAt: string;

  @IsOptional()
  @IsString()
  plannedWorkoutId?: string;
}
