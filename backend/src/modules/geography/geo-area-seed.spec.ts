/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- The focused Prisma transaction mock intentionally exposes Jest call data. */

import { PrismaClient } from '@prisma/client';

import { seedNationalGeoCatalog } from './geo-area-seed';

function createSeedPrismaMock() {
  const summitUpdate = jest.fn().mockResolvedValue({});
  const summitGeoAreaCreateMany = jest.fn().mockResolvedValue({ count: 0 });
  const transaction = {
    geoArea: {
      upsert: jest.fn().mockImplementation(({ create }) =>
        Promise.resolve({
          id: create.id,
          name: create.name,
          parentId: create.parentId ?? null,
        }),
      ),
      findMany: jest.fn().mockImplementation(({ where }) =>
        Promise.resolve(
          where
            ? [
                {
                  id: 'geo-admin-massif',
                  name: 'Massif administré',
                  parentId: 'geo-alpes',
                },
              ]
            : [
                { id: 'geo-france', name: 'France', parentId: null },
                {
                  id: 'geo-alpes',
                  name: 'Alpes',
                  parentId: 'geo-france',
                },
                {
                  id: 'geo-admin-massif',
                  name: 'Massif administré',
                  parentId: 'geo-alpes',
                },
              ],
        ),
      ),
    },
    summit: {
      findMany: jest.fn().mockImplementation(({ distinct }) =>
        Promise.resolve(
          distinct
            ? [{ massif: 'Massif historique' }]
            : [
                {
                  id: 'summit-administered',
                  massif: 'Massif historique',
                  primaryMassifId: 'geo-admin-massif',
                },
              ],
        ),
      ),
      update: summitUpdate,
    },
    summitGeoArea: { createMany: summitGeoAreaCreateMany },
  };
  const prisma = {
    $transaction: jest.fn(
      (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    ),
  };

  return {
    prisma: prisma as unknown as PrismaClient,
    summitGeoAreaCreateMany,
    summitUpdate,
  };
}

describe('seedNationalGeoCatalog', () => {
  it('is repeatable and never overwrites an administered primary massif', async () => {
    const { prisma, summitGeoAreaCreateMany, summitUpdate } =
      createSeedPrismaMock();

    await seedNationalGeoCatalog(prisma);
    await seedNationalGeoCatalog(prisma);

    expect(summitUpdate).not.toHaveBeenCalled();
    expect(summitGeoAreaCreateMany).toHaveBeenCalledTimes(2);
    expect(summitGeoAreaCreateMany).toHaveBeenNthCalledWith(1, {
      data: [
        {
          summitId: 'summit-administered',
          geoAreaId: 'geo-admin-massif',
        },
        { summitId: 'summit-administered', geoAreaId: 'geo-alpes' },
        { summitId: 'summit-administered', geoAreaId: 'geo-france' },
      ],
      skipDuplicates: true,
    });
    expect(summitGeoAreaCreateMany).toHaveBeenNthCalledWith(
      2,
      summitGeoAreaCreateMany.mock.calls[0]?.[0],
    );
  });
});
