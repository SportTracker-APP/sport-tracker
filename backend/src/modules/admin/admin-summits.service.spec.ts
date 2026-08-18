/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Jest asymmetric matchers expose `any` in their public typings. */

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  SummitAdminAuditAction,
  SummitCatalogStatus,
  SummitCatalogTier,
  SummitImportCandidateStatus,
  SummitImportRunStatus,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { GeoAreasService } from '../geography/geo-areas.service';
import { AdminSummitsService } from './admin-summits.service';

const completeSummit = {
  id: 'la-tournette',
  name: 'La Tournette',
  aliases: [],
  altitude: 2351,
  massif: 'Bornes',
  difficulty: 'Expert',
  type: 'Sommet',
  longitude: 6.287,
  latitude: 45.827,
  imageUrl: null,
  imageCredit: null,
  sourceUrl: null,
  isActive: false,
  catalogStatus: SummitCatalogStatus.READY,
  primaryMassifId: 'bornes',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

function createService(
  prisma: Record<string, unknown>,
  geoAreasService: Record<string, unknown> = {},
) {
  return new AdminSummitsService(
    prisma as unknown as PrismaService,
    geoAreasService as unknown as GeoAreasService,
  );
}

describe('AdminSummitsService', () => {
  it('searches the catalogue server-side and returns pagination with quality', async () => {
    const summitRow = {
      id: completeSummit.id,
      name: completeSummit.name,
      altitude: completeSummit.altitude,
      latitude: completeSummit.latitude,
      longitude: completeSummit.longitude,
      massif: completeSummit.massif,
      catalogStatus: completeSummit.catalogStatus,
      isActive: true,
      primaryMassifId: 'bornes',
      primaryMassif: {
        id: 'bornes',
        name: 'Bornes',
        slug: 'bornes',
        type: 'MASSIF',
      },
      _count: { geoAreas: 4 },
    };
    const prisma = {
      summit: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue([[summitRow], 1]),
    };
    const service = createService(prisma);

    const result = await service.findAll({
      search: 'Bornes',
      page: 1,
      pageSize: 20,
    });

    expect(prisma.summit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
        skip: 0,
        take: 20,
      }),
    );
    expect(result.items[0]?.quality.isComplete).toBe(true);
    expect(result.pagination.total).toBe(1);
  });

  it('returns an empty catalogue search without inventing results', async () => {
    const prisma = {
      summit: { findMany: jest.fn(), count: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([[], 0]),
    };

    await expect(
      createService(prisma).findAll({ page: 1, pageSize: 20 }),
    ).resolves.toEqual({
      items: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
  });

  it('returns 404 for an unknown summit detail', async () => {
    const prisma = {
      summit: { findUnique: jest.fn().mockResolvedValue(null) },
      geoArea: { findMany: jest.fn().mockResolvedValue([]) },
    };

    await expect(
      createService(prisma).findOne('unknown'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('publishes a ready complete summit and records before/after with admin id', async () => {
    const auditCreate = jest.fn().mockResolvedValue({});
    const transaction = {
      summit: {
        findUnique: jest.fn().mockResolvedValue({
          ...completeSummit,
          _count: { geoAreas: 4 },
        }),
        update: jest.fn().mockResolvedValue({
          ...completeSummit,
          isActive: true,
        }),
      },
      summitAdminAuditLog: { create: auditCreate },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const service = createService(prisma);
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValue({ id: completeSummit.id } as never);

    await service.update('admin-1', completeSummit.id, { isActive: true });

    expect(transaction.summit.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: true } }),
    );
    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        summitId: completeSummit.id,
        adminUserId: 'admin-1',
        action: SummitAdminAuditAction.PUBLICATION_CHANGED,
        before: { isActive: false },
        after: { isActive: true },
      }),
    });
  });

  it('refuses publication when the catalogue status is not ready', async () => {
    const transaction = {
      summit: {
        findUnique: jest.fn().mockResolvedValue({
          ...completeSummit,
          catalogStatus: SummitCatalogStatus.REVIEW,
          _count: { geoAreas: 4 },
        }),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };

    await expect(
      createService(prisma).update('admin-1', completeSummit.id, {
        isActive: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('publishes only eligible imported summits from an explicit import run', async () => {
    const transaction = {
      summit: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
      summitAdminAuditLog: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      summitImportRun: { update: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      summitImportRun: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'import-74',
          candidates: [
            { matchedSummitId: 'summit-ready-1' },
            { matchedSummitId: 'summit-ready-2' },
          ],
        }),
      },
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };

    await expect(
      createService(prisma).publishImportRun('admin-1', 'import-74'),
    ).resolves.toEqual({ importRunId: 'import-74', publishedCount: 2 });

    expect(prisma.summitImportRun.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          candidates: expect.objectContaining({
            where: {
              status: SummitImportCandidateStatus.IMPORTED,
              matchedSummit: {
                catalogStatus: SummitCatalogStatus.READY,
                catalogTier: { not: SummitCatalogTier.REFERENCE },
                isActive: false,
              },
            },
          }),
        },
      }),
    );
    expect(transaction.summit.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['summit-ready-1', 'summit-ready-2'] },
        catalogStatus: SummitCatalogStatus.READY,
        catalogTier: { not: SummitCatalogTier.REFERENCE },
      },
      data: { isActive: true },
    });
    expect(transaction.summitImportRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: SummitImportRunStatus.PUBLISHED,
          publishedByUserId: 'admin-1',
        }),
      }),
    );
  });

  it('audits a status change and masks a summit that is no longer ready', async () => {
    const auditCreate = jest.fn().mockResolvedValue({});
    const transaction = {
      summit: {
        findUnique: jest.fn().mockResolvedValue({
          ...completeSummit,
          isActive: true,
          _count: { geoAreas: 4 },
        }),
        update: jest.fn().mockResolvedValue({
          ...completeSummit,
          catalogStatus: SummitCatalogStatus.REVIEW,
          isActive: false,
        }),
      },
      summitAdminAuditLog: { create: auditCreate },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const service = createService(prisma);
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValue({ id: completeSummit.id } as never);

    await service.update('admin-1', completeSummit.id, {
      catalogStatus: SummitCatalogStatus.REVIEW,
    });

    expect(transaction.summit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          catalogStatus: SummitCatalogStatus.REVIEW,
          isActive: false,
        },
      }),
    );
    expect(auditCreate).toHaveBeenCalledTimes(2);
    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: SummitAdminAuditAction.STATUS_CHANGED,
      }),
    });
    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: SummitAdminAuditAction.PUBLICATION_CHANGED,
      }),
    });
  });

  it('refuses a duplicate GeoArea association', async () => {
    const transaction = {
      summit: { findUnique: jest.fn().mockResolvedValue(completeSummit) },
      geoArea: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'alpes',
          name: 'Alpes',
        }),
      },
      summitGeoArea: { findUnique: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };

    await expect(
      createService(prisma).addGeoArea('admin-1', completeSummit.id, 'alpes'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses an unknown GeoArea before creating an association', async () => {
    const transaction = {
      summit: { findUnique: jest.fn().mockResolvedValue(completeSummit) },
      geoArea: { findUnique: jest.fn().mockResolvedValue(null) },
      summitGeoArea: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };

    await expect(
      createService(prisma).addGeoArea('admin-1', completeSummit.id, 'unknown'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(transaction.summitGeoArea.create).not.toHaveBeenCalled();
  });

  it('adds a GeoArea and records the catalogue-only audit payload', async () => {
    const auditCreate = jest.fn().mockResolvedValue({});
    const transaction = {
      summit: { findUnique: jest.fn().mockResolvedValue(completeSummit) },
      geoArea: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'alpes',
          name: 'Alpes',
          type: 'MOUNTAIN_CHAIN',
        }),
      },
      summitGeoArea: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
      },
      summitAdminAuditLog: { create: auditCreate },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const service = createService(prisma);
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValue({ id: completeSummit.id } as never);

    await service.addGeoArea('admin-1', completeSummit.id, 'alpes');

    expect(transaction.summitGeoArea.create).toHaveBeenCalledWith({
      data: { summitId: completeSummit.id, geoAreaId: 'alpes' },
    });
    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: SummitAdminAuditAction.GEO_AREA_ADDED,
        adminUserId: 'admin-1',
      }),
    });
  });

  it('prevents removal of the primary massif or one of its ancestors', async () => {
    const transaction = {
      summit: { findUnique: jest.fn().mockResolvedValue(completeSummit) },
      geoArea: {
        findUnique: jest.fn().mockResolvedValue({ id: 'alpes', name: 'Alpes' }),
        findMany: jest.fn().mockResolvedValue([
          { id: 'bornes', parentId: 'alpes' },
          { id: 'alpes', parentId: null },
        ]),
      },
      summitGeoArea: {
        findUnique: jest.fn().mockResolvedValue({}),
        delete: jest.fn(),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };

    await expect(
      createService(prisma).removeGeoArea(
        'admin-1',
        completeSummit.id,
        'alpes',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction.summitGeoArea.delete).not.toHaveBeenCalled();
  });

  it('reuses the Phase A primary massif transaction and audits the change', async () => {
    const auditCreate = jest.fn().mockResolvedValue({});
    const transaction = {
      summit: {
        findUnique: jest.fn().mockResolvedValue({
          ...completeSummit,
          primaryMassif: { id: 'bornes', name: 'Bornes' },
        }),
      },
      summitAdminAuditLog: { create: auditCreate },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const geoAreasService = {
      setSummitPrimaryMassifInTransaction: jest.fn().mockResolvedValue({
        ...completeSummit,
        primaryMassifId: 'aravis',
        primaryMassif: { id: 'aravis', name: 'Aravis' },
      }),
    };
    const service = createService(prisma, geoAreasService);
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValue({ id: completeSummit.id } as never);

    await service.updatePrimaryMassif('admin-1', completeSummit.id, 'aravis');

    expect(
      geoAreasService.setSummitPrimaryMassifInTransaction,
    ).toHaveBeenCalledWith(transaction, completeSummit.id, 'aravis');
    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: SummitAdminAuditAction.PRIMARY_MASSIF_CHANGED,
        before: { id: 'bornes', name: 'Bornes' },
        after: { id: 'aravis', name: 'Aravis' },
      }),
    });
  });
});
