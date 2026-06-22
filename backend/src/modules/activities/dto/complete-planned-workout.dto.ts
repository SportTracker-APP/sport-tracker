import { IsString } from 'class-validator';

export class CompletePlannedWorkoutDto {
  @IsString()
  activityId: string;
}
