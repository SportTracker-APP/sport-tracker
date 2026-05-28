import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export enum SportType {
  TRAIL = "TRAIL",
  RUNNING = "RUNNING",
  HIKING = "HIKING",
  MTB = "MTB",
  WALKING = "WALKING",
}

export class CreateActivityDto {
  @IsEnum(SportType)
  sport: SportType;

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
}