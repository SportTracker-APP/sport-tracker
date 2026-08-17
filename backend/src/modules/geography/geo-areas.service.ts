import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GeoAreaType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
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
        _count: { select: { summitLinks: true } },
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
        _count: { select: { summitLinks: true } },
      },
    });

    if (!area) {
      throw new NotFoundException('Territoire introuvable');
    }

    return area;
  }

  async getPublishedAreaIds(geoAreaId: string, includeDescendants: boolean) {
    const areas = await this.prisma.geoArea.findMany({
      where: { isPublished: true },
      select: { id: true, parentId: true },
    });

    if (!areas.some((area) => area.id === geoAreaId)) {
      throw new NotFoundException('Territoire publié introuvable');
    }

    if (!includeDescendants) {
      return [geoAreaId];
    }

    const childrenByParentId = new Map<string, string[]>();

    for (const area of areas) {
      if (!area.parentId) continue;
      const children = childrenByParentId.get(area.parentId) ?? [];
      children.push(area.id);
      childrenByParentId.set(area.parentId, children);
    }

    const includedIds = new Set([geoAreaId]);
    const pendingAreaIds = [geoAreaId];

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

  async setSummitPrimaryMassif(summitId: string, geoAreaId: string) {
    return this.prisma.$transaction(async (transaction) => {
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
    });
  }
}
