import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AdminGuard } from './admin.guard';

function createContext(userId?: string) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: { id: userId } }) }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  it('refuses a standard user with a 403', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          role: UserRole.USER,
          isBlocked: false,
        }),
      },
    };
    const guard = new AdminGuard(prisma as unknown as PrismaService);

    await expect(
      guard.canActivate(createContext('user-1')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows an active administrator', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          role: UserRole.ADMIN,
          isBlocked: false,
        }),
      },
    };
    const guard = new AdminGuard(prisma as unknown as PrismaService);

    await expect(guard.canActivate(createContext('admin-1'))).resolves.toBe(
      true,
    );
  });
});
