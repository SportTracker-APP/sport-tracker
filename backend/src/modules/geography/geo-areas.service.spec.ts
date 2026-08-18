/* eslint-disable @typescript-eslint/no-unsafe-member-access -- Jest mock call arguments are exposed as `any`. */
import { BadRequestException } from '@nestjs/common';
import {
  GeoAreaType,
  SummitCatalogStatus,
  SummitCatalogTier,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { GeoAreasService } from './geo-areas.service';

describe('GeoAreasService', () => {
  it('never counts masked summits in public territory responses', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new GeoAreasService({
      geoArea: { findMany },
    } as unknown as PrismaService);

    await service.findAll({});

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          _count: {
            select: {
              summitLinks: {
                where: {
                  summit: {
                    isActive: true,
                    catalogStatus: SummitCatalogStatus.READY,
                    catalogTier: SummitCatalogTier.CORE,
                  },
                },
              },
            },
          },
        },
      }),
    );
  });

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

  it('unions several territories and their descendants without duplicates', async () => {
    const service = new GeoAreasService({
      geoArea: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'haute-savoie', parentId: 'aura' },
          { id: 'aravis', parentId: 'haute-savoie' },
          { id: 'mont-blanc', parentId: 'haute-savoie' },
          { id: 'bauges', parentId: 'haute-savoie' },
        ]),
      },
    } as unknown as PrismaService);

    await expect(
      service.getPublishedAreaIdsForMany(
        ['aravis', 'mont-blanc', 'aravis'],
        true,
      ),
    ).resolves.toEqual(['aravis', 'mont-blanc']);
  });

  it('derives onboarding options only from published areas with public summits', async () => {
    const findMany = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: 'haute-savoie',
          name: 'Haute-Savoie',
          slug: 'haute-savoie',
          type: GeoAreaType.DEPARTMENT,
          parentId: 'aura',
          _count: { summitLinks: 846 },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'aravis',
          name: 'Aravis',
          slug: 'aravis',
          type: GeoAreaType.MASSIF,
          _count: { summitLinks: 42 },
        },
      ]);
    const service = new GeoAreasService({
      geoArea: { findMany },
    } as unknown as PrismaService);

    await expect(service.findDiscoveryOptions()).resolves.toEqual([
      expect.objectContaining({
        id: 'haute-savoie',
        massifs: [expect.objectContaining({ id: 'aravis' })],
      }),
    ]);
    const departmentQuery = findMany.mock.calls[0]?.[0] as {
      where: Record<string, unknown>;
    };
    const massifQuery = findMany.mock.calls[1]?.[0] as {
      where: Record<string, unknown>;
    };
    expect(departmentQuery.where).toMatchObject({
      type: GeoAreaType.DEPARTMENT,
      isPublished: true,
    });
    expect(massifQuery.where).toMatchObject({
      type: GeoAreaType.MASSIF,
      isPublished: true,
    });
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
