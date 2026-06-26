import { ForbiddenException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { AdminService } from './admin.service';

type PrismaMock = {
  user: {
    deleteMany: jest.Mock;
  };
};

function makeService(prisma: PrismaMock) {
  return new AdminService(prisma as unknown as PrismaService);
}

describe('AdminService user deletion', () => {
  it('deletes a user by id', async () => {
    const prisma: PrismaMock = {
      user: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    await expect(
      makeService(prisma).deleteUser('admin-1', 'user-1'),
    ).resolves.toEqual({
      success: true,
    });
    expect(prisma.user.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
      },
    });
  });

  it('prevents an admin from deleting their own account', async () => {
    const prisma: PrismaMock = {
      user: {
        deleteMany: jest.fn(),
      },
    };

    await expect(
      makeService(prisma).deleteUser('admin-1', 'admin-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.user.deleteMany).not.toHaveBeenCalled();
  });
});
