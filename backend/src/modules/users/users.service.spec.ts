import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service';

import { UsersService } from './users.service';

type PrismaMock = {
  user: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

function makePrismaMock(): PrismaMock {
  return {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
}

describe('UsersService security', () => {
  it('revokes refresh sessions and stores a bcrypt hash when password changes', async () => {
    const prisma = makePrismaMock();
    const currentPasswordHash = await bcrypt.hash('OldPassword1', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      password: currentPasswordHash,
    });

    await new UsersService(prisma as unknown as PrismaService).updatePassword(
      'user-1',
      {
        currentPassword: 'OldPassword1',
        newPassword: 'NewPassword1',
      },
    );

    const updatePayload = prisma.user.update.mock.calls[0]?.[0] as {
      data: {
        password: string;
        refreshToken: null;
      };
    };

    expect(updatePayload.data.password).not.toBe('NewPassword1');
    expect(updatePayload.data.password).toMatch(/^\$2[ab]\$/);
    expect(updatePayload.data.refreshToken).toBeNull();
  });
});
