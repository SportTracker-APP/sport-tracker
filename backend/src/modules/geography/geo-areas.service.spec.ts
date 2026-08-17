import { BadRequestException } from '@nestjs/common';
import { GeoAreaType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { GeoAreasService } from './geo-areas.service';

describe('GeoAreasService', () => {
  it('resolves a parent territory and all descendants with one hierarchy read', async () => {
    const findMany = jest.fn().mockResolvedValue([
      { id: 'alpes', parentId: 'france' },
      { id: 'north', parentId: 'alpes' },
      { id: 'aravis', parentId: 'north' },
      { id: 'pyrenees', parentId: 'france' },
    ]);
    const service = new GeoAreasService({
      geoArea: { findMany },
    } as unknown as PrismaService);

    await expect(service.getPublishedAreaIds('alpes', true)).resolves.toEqual([
      'alpes',
      'north',
      'aravis',
    ]);
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it('does not include descendants when the filter asks for a direct area', async () => {
    const service = new GeoAreasService({
      geoArea: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'alpes', parentId: 'france' },
          { id: 'north', parentId: 'alpes' },
        ]),
      },
    } as unknown as PrismaService);

    await expect(service.getPublishedAreaIds('alpes', false)).resolves.toEqual([
      'alpes',
    ]);
  });

  it('sets a MASSIF as primary and guarantees all ancestor associations', async () => {
    const createMany = jest.fn().mockResolvedValue({ count: 3 });
    const update = jest.fn().mockResolvedValue({ id: 'summit-1' });
    const transaction = {
      summit: {
        findUnique: jest.fn().mockResolvedValue({ id: 'summit-1' }),
        update,
      },
      geoArea: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'aravis',
          name: 'Aravis',
          type: GeoAreaType.MASSIF,
        }),
        findMany: jest.fn().mockResolvedValue([
          { id: 'france', parentId: null },
          { id: 'alpes', parentId: 'france' },
          { id: 'aravis', parentId: 'alpes' },
        ]),
      },
      summitGeoArea: { createMany },
    };
    const service = new GeoAreasService({
      $transaction: jest.fn(
        async (callback: (client: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    } as unknown as PrismaService);

    await service.setSummitPrimaryMassif('summit-1', 'aravis');

    expect(createMany).toHaveBeenCalledWith({
      data: [
        { summitId: 'summit-1', geoAreaId: 'aravis' },
        { summitId: 'summit-1', geoAreaId: 'alpes' },
        { summitId: 'summit-1', geoAreaId: 'france' },
      ],
      skipDuplicates: true,
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { massif: 'Aravis', primaryMassifId: 'aravis' },
      }),
    );
  });

  it('rejects an incompatible primary territory before writing associations', async () => {
    const createMany = jest.fn();
    const transaction = {
      summit: {
        findUnique: jest.fn().mockResolvedValue({ id: 'summit-1' }),
      },
      geoArea: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'alpes',
          name: 'Alpes',
          type: GeoAreaType.MOUNTAIN_CHAIN,
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      summitGeoArea: { createMany },
    };
    const service = new GeoAreasService({
      $transaction: jest.fn(
        async (callback: (client: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    } as unknown as PrismaService);

    await expect(
      service.setSummitPrimaryMassif('summit-1', 'alpes'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(createMany).not.toHaveBeenCalled();
  });
});
