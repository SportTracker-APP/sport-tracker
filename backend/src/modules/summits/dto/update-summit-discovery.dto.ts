import { IsEnum } from 'class-validator';
import { SummitDiscoveryStatus } from '@prisma/client';

export class UpdateSummitDiscoveryDto {
  @IsEnum(SummitDiscoveryStatus)
  status!: SummitDiscoveryStatus;
}
