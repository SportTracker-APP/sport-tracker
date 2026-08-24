/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Jest asymmetric matchers expose `any` in their public typings. */

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  GeoAreaType,
  SummitAdminAuditAction,
  SummitCatalogStatus,
  SummitCatalogTier,
  SummitExternalProvider,
  SummitImportCandidateStatus,
  SummitImportResolutionAction,
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
  it('creates a manual summit with territories, external reference and audit in one transaction', async () => {
    const transaction = {
      summit: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({}),
      },
      geoArea: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'france',
            name: 'France',
            type: GeoAreaType.COUNTRY,
            parentId: null,
            isPublished: true,
          },
          {
            id: 'haute-savoie',
            name: 'Haute-Savoie',
            type: GeoAreaType.DEPARTMENT,
            parentId: 'france',
            isPublished: true,
          },
          {
            id: 'chablais',
            name: 'Chablais',
            type: GeoAreaType.MASSIF,
            parentId: 'haute-savoie',
            isPublished: true,
          },
        ]),
      },
      summitExternalReference: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      summitAdminAuditLog: { create: jest.fn().mockResolvedValue({}) },
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
      .mockResolvedValue({ id: 'grand-velan' } as never);

    await expect(
      service.create('admin-1', {
        name: 'Grand Vélan',
        altitude: 3727,
        latitude: 45.89,
        longitude: 7.25,
        type: 'Sommet',
        primaryMassifId: 'chablais',
        geoAreaIds: ['haute-savoie'],
        catalogTier: SummitCatalogTier.CORE,
        catalogStatus: SummitCatalogStatus.READY,
        isActive: true,
        sourceUrl: 'https://example.test/grand-velan',
        externalReference: {
          provider: SummitExternalProvider.IGN_BD_TOPO,
          externalId: 'IGN-VELAN',
          sourceName: 'IGN BD TOPO',
          sourceVersion: '2026',
        },
      }),
    ).resolves.toEqual({ id: 'grand-velan' });

    expect(transaction.summit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'grand-velan',
        massif: 'Chablais',
        isActive: true,
        geoAreas: {
          create: expect.arrayContaining([
            { geoAreaId: 'chablais' },
            { geoAreaId: 'haute-savoie' },
            { geoAreaId: 'france' },
          ]),
        },
        externalReferences: {
          create: expect.objectContaining({ externalId: 'IGN-VELAN' }),
        },
      }),
    });
    expect(transaction.summitAdminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: SummitAdminAuditAction.MANUAL_SUMMIT_CREATED,
        adminUserId: 'admin-1',
      }),
    });
  });

  it('blocks a manual summit within 75 metres of an existing summit', async () => {
    const transaction = {
      summit: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'existing',
            name: 'Sommet existant',
            latitude: 45.9,
            longitude: 6.1,
          },
        ]),
      },
      geoArea: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };

    await expect(
      createService(prisma).create('admin-1', {
        name: 'Presque le même sommet',
        altitude: 1800,
        latitude: 45.9001,
        longitude: 6.1001,
        type: 'Sommet',
        primaryMassifId: 'massif',
        catalogTier: SummitCatalogTier.CORE,
        catalogStatus: SummitCatalogStatus.DRAFT,
        isActive: false,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows a distant homonym with a stable geographic identifier', async () => {
    const transaction = {
      summit: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'le-velan',
          name: 'Le Vélan',
        }),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({}),
      },
      geoArea: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'massif',
            name: 'Massif test',
            type: GeoAreaType.MASSIF,
            parentId: null,
            isPublished: true,
          },
        ]),
      },
      summitAdminAuditLog: { create: jest.fn().mockResolvedValue({}) },
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
      .mockResolvedValue({ id: 'created' } as never);

    await service.create('admin-1', {
      name: 'Le Vélan',
      altitude: 2100,
      latitude: 46.1234,
      longitude: 6.2345,
      type: 'Sommet',
      primaryMassifId: 'massif',
      catalogTier: SummitCatalogTier.CORE,
      catalogStatus: SummitCatalogStatus.DRAFT,
      isActive: false,
    });

    expect(transaction.summit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ id: 'le-velan-n461234-e62345' }),
    });
  });

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

  it('applies create and ignore decisions after publication without rewriting run statistics', async () => {
    const createCandidate = {
      id: 'candidate-create',
      externalId: 'IGN-NEW',
      name: 'Pointe nouvelle',
      elevation: 2140,
      latitude: 46.1,
      longitude: 6.4,
      sourceNature: 'Sommet',
      suggestedTier: SummitCatalogTier.CORE,
      catalogTier: SummitCatalogTier.SECONDARY,
      tierReason: 'Décision admin',
      resolutionAction: SummitImportResolutionAction.CREATE_NEW,
      matchedSummitId: null,
    };
    const ignoreCandidate = {
      ...createCandidate,
      id: 'candidate-ignore',
      externalId: 'IGN-IGNORE',
      name: 'Point à ignorer',
      resolutionAction: SummitImportResolutionAction.IGNORE,
    };
    const transaction = {
      geoArea: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'france',
            slug: 'france',
            parentId: null,
            isPublished: true,
          },
          {
            id: 'haute-savoie',
            slug: 'haute-savoie',
            parentId: 'france',
            isPublished: true,
          },
        ]),
      },
      summitImportCandidate: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
      },
      summitExternalReference: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
      },
      summit: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn(),
      },
      summitAdminAuditLog: { create: jest.fn().mockResolvedValue({}) },
      summitImportRun: { update: jest.fn() },
    };
    const prisma = {
      summitImportRun: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'published-run',
          status: SummitImportRunStatus.PUBLISHED,
          provider: SummitExternalProvider.IGN_BD_TOPO,
          sourceVersion: '2026-07',
          sourceName: 'IGN BD TOPO',
          candidates: [createCandidate, ignoreCandidate],
        }),
      },
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };

    await expect(
      createService(prisma).publishComplementaryResolutions(
        'admin-1',
        'published-run',
      ),
    ).resolves.toEqual({
      importRunId: 'published-run',
      appliedCount: 2,
      createdCount: 1,
      matchedCount: 0,
      ignoredCount: 1,
    });

    expect(transaction.summit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          catalogTier: SummitCatalogTier.SECONDARY,
          catalogStatus: SummitCatalogStatus.READY,
          isActive: true,
        }),
      }),
    );
    expect(transaction.summitImportCandidate.update).toHaveBeenCalledWith({
      where: { id: 'candidate-ignore' },
      data: { status: SummitImportCandidateStatus.SKIPPED },
    });
    expect(transaction.summitImportRun.update).not.toHaveBeenCalled();
    expect(transaction.summitAdminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: SummitAdminAuditAction.IMPORT_COMPLEMENTARY_APPLIED,
        adminUserId: 'admin-1',
      }),
    });
  });

  it('associates a resolved candidate to the existing summit without duplication', async () => {
    const candidate = {
      id: 'candidate-match',
      externalId: 'IGN-MATCH',
      name: 'Sommet legacy',
      elevation: null,
      suggestedTier: SummitCatalogTier.CORE,
      catalogTier: SummitCatalogTier.REFERENCE,
      tierReason: 'Conservé comme référence',
      resolutionAction: SummitImportResolutionAction.MATCH_EXISTING,
      matchedSummitId: 'legacy-summit',
    };
    const transaction = {
      geoArea: { findMany: jest.fn() },
      summitImportCandidate: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
      },
      summitExternalReference: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
      },
      summit: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'legacy-summit',
          catalogStatus: SummitCatalogStatus.READY,
          catalogTier: SummitCatalogTier.CORE,
          isActive: true,
        }),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn(),
      },
      summitAdminAuditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      summitImportRun: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'published-run',
          status: SummitImportRunStatus.PUBLISHED,
          provider: SummitExternalProvider.IGN_BD_TOPO,
          sourceVersion: '2026-07',
          sourceName: 'IGN BD TOPO',
          candidates: [candidate],
        }),
      },
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };

    await expect(
      createService(prisma).publishComplementaryResolutions(
        'admin-1',
        'published-run',
      ),
    ).resolves.toMatchObject({
      appliedCount: 1,
      createdCount: 0,
      matchedCount: 1,
    });

    expect(transaction.summit.create).not.toHaveBeenCalled();
    expect(transaction.summit.update).toHaveBeenCalledWith({
      where: { id: 'legacy-summit' },
      data: expect.objectContaining({
        catalogTier: SummitCatalogTier.REFERENCE,
        isActive: false,
      }),
    });
    expect(transaction.summitExternalReference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ summitId: 'legacy-summit' }),
      }),
    );
  });

  it('is idempotent when no resolved candidate remains to apply', async () => {
    const prisma = {
      summitImportRun: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'published-run',
          status: SummitImportRunStatus.PUBLISHED,
          candidates: [],
        }),
      },
      $transaction: jest.fn(),
    };

    await expect(
      createService(prisma).publishComplementaryResolutions(
        'admin-1',
        'published-run',
      ),
    ).resolves.toEqual({
      importRunId: 'published-run',
      appliedCount: 0,
      createdCount: 0,
      matchedCount: 0,
      ignoredCount: 0,
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('never reopens an import run that is not already published', async () => {
    const prisma = {
      summitImportRun: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'prepared-run',
          status: SummitImportRunStatus.PREPARED,
          candidates: [],
        }),
      },
      $transaction: jest.fn(),
    };

    await expect(
      createService(prisma).publishComplementaryResolutions(
        'admin-1',
        'prepared-run',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
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
