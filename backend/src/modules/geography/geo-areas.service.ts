import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GeoAreaType, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { PUBLIC_SUMMIT_WHERE } from '../summits/summit-publication';
import { ListGeoAreasDto } from './dto/list-geo-areas.dto';

@Injectable()
export class GeoAreasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: ListGeoAreasDto) {
    return this.prisma.geoArea.findMany({
      where: {
        type: query.type,
        parentId: query.parentId,
        isPublished: query.published ?? true,
      },
      include: {
        _count: {
          select: {
            summitLinks: { where: { summit: PUBLIC_SUMMIT_WHERE } },
          },
        },
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async findBySlug(slug: string) {
    const area = await this.prisma.geoArea.findFirst({
      where: { slug, isPublished: true },
      include: {
        parent: true,
        children: {
          where: { isPublished: true },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            summitLinks: { where: { summit: PUBLIC_SUMMIT_WHERE } },
          },
        },
      },
    });

    if (!area) {
      throw new NotFoundException('Territoire introuvable');
    }

    return area;
  }

  async getPublishedAreaIds(geoAreaId: string, includeDescendants: boolean) {
    return this.getPublishedAreaIdsForMany([geoAreaId], includeDescendants);
  }

  async getPublishedAreaIdsForMany(
    geoAreaIds: string[],
    includeDescendants: boolean,
  ) {
    const uniqueGeoAreaIds = [...new Set(geoAreaIds)];
    const areas = await this.prisma.geoArea.findMany({
      where: { isPublished: true },
      select: { id: true, parentId: true },
    });

    const availableIds = new Set(areas.map((area) => area.id));
    if (uniqueGeoAreaIds.some((areaId) => !availableIds.has(areaId))) {
      throw new NotFoundException('Un territoire publié est introuvable');
    }

    if (!includeDescendants) {
      return uniqueGeoAreaIds;
    }

    const childrenByParentId = new Map<string, string[]>();

    for (const area of areas) {
      if (!area.parentId) continue;
      const children = childrenByParentId.get(area.parentId) ?? [];
      children.push(area.id);
      childrenByParentId.set(area.parentId, children);
    }

    const includedIds = new Set(uniqueGeoAreaIds);
    const pendingAreaIds = [...uniqueGeoAreaIds];

    for (let index = 0; index < pendingAreaIds.length; index += 1) {
      const parentId = pendingAreaIds[index];

      for (const childId of childrenByParentId.get(parentId) ?? []) {
        if (includedIds.has(childId)) continue;
        includedIds.add(childId);
        pendingAreaIds.push(childId);
      }
    }

    return [...includedIds];
  }

  async findDiscoveryOptions() {
    const departments = await this.prisma.geoArea.findMany({
      where: {
        type: GeoAreaType.DEPARTMENT,
        isPublished: true,
        summitLinks: { some: { summit: PUBLIC_SUMMIT_WHERE } },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        parentId: true,
        _count: {
          select: {
            summitLinks: { where: { summit: PUBLIC_SUMMIT_WHERE } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return Promise.all(
      departments.map(async (department) => {
        const massifs = await this.prisma.geoArea.findMany({
          where: {
            type: GeoAreaType.MASSIF,
            isPublished: true,
            summitLinks: {
              some: {
                summit: {
                  ...PUBLIC_SUMMIT_WHERE,
                  geoAreas: { some: { geoAreaId: department.id } },
                },
              },
            },
          },
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            _count: {
              select: {
                summitLinks: {
                  where: {
                    summit: {
                      ...PUBLIC_SUMMIT_WHERE,
                      geoAreas: { some: { geoAreaId: department.id } },
                    },
                  },
                },
              },
            },
          },
          orderBy: { name: 'asc' },
        });

        return { ...department, massifs };
      }),
    );
  }

  async setSummitPrimaryMassif(summitId: string, geoAreaId: string) {
    return this.prisma.$transaction((transaction) =>
      this.setSummitPrimaryMassifInTransaction(
        transaction,
        summitId,
        geoAreaId,
      ),
    );
  }

  async setSummitPrimaryMassifInTransaction(
    transaction: Prisma.TransactionClient,
    summitId: string,
    geoAreaId: string,
  ) {
    const [summit, massif, areas] = await Promise.all([
      transaction.summit.findUnique({ where: { id: summitId } }),
      transaction.geoArea.findUnique({ where: { id: geoAreaId } }),
      transaction.geoArea.findMany({
        select: { id: true, parentId: true },
      }),
    ]);

    if (!summit) {
      throw new NotFoundException('Sommet introuvable');
    }

    if (!massif) {
      throw new NotFoundException('Territoire introuvable');
    }

    if (massif.type !== GeoAreaType.MASSIF) {
      throw new BadRequestException(
        'Le massif principal doit être un territoire de type MASSIF',
      );
    }

    const parentByAreaId = new Map(
      areas.map((area) => [area.id, area.parentId]),
    );
    const geoAreaIds: string[] = [];
    let currentAreaId: string | null = massif.id;

    while (currentAreaId) {
      geoAreaIds.push(currentAreaId);
      currentAreaId = parentByAreaId.get(currentAreaId) ?? null;
    }

    await transaction.summitGeoArea.createMany({
      data: geoAreaIds.map((areaId) => ({
        summitId,
        geoAreaId: areaId,
      })),
      skipDuplicates: true,
    });

    return transaction.summit.update({
      where: { id: summitId },
      data: {
        massif: massif.name,
        primaryMassifId: massif.id,
      },
      include: {
        primaryMassif: true,
        geoAreas: { include: { geoArea: true } },
      },
    });
  }
}
