import { IsEnum } from 'class-validator';

export enum SummitDiscoveryDecision {
  CONFIRMED = 'CONFIRMED',
  DISMISSED = 'DISMISSED',
}

export class UpdateSummitDiscoveryDto {
  @IsEnum(SummitDiscoveryDecision)
  status!: SummitDiscoveryDecision;
}
