import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

import { UserRole } from '@prisma/client';

export class UpdateAdminUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}
