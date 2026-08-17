import { createHash } from 'node:crypto';

import { GeoAreaType, PrismaClient } from '@prisma/client';

import { GEO_AREA_CATALOG } from './geo-area-catalog';

function getLegacyAreaIdentity(name: string) {
  const hash = createHash('md5').update(name).digest('hex');

  return {
    id: `geo-legacy-${hash}`,
    slug: `legacy-massif-${hash}`,
  };
}

export async function seedNationalGeoCatalog(
  prisma: PrismaClient,
  options: { summitIds?: string[] } = {},
) {
  return prisma.$transaction(async (transaction) => {
    const areasBySlug = new Map<
      string,
      { id: string; name: string; parentId: string | null }
    >();

    for (const entry of GEO_AREA_CATALOG) {
      const parentId = entry.parentSlug
        ? areasBySlug.get(entry.parentSlug)?.id
        : null;

      if (entry.parentSlug && !parentId) {
        throw new Error(`Parent GeoArea missing for ${entry.slug}`);
      }

      const area = await transaction.geoArea.upsert({
        where: { slug: entry.slug },
        create: {
          id: entry.id,
          name: entry.name,
          slug: entry.slug,
          type: entry.type,
          parentId,
          isPublished: entry.isPublished,
        },
        update: {
          name: entry.name,
          type: entry.type,
          parentId,
          isPublished: entry.isPublished,
        },
        select: { id: true, name: true, parentId: true },
      });

      areasBySlug.set(entry.slug, area);
    }

    const legacyMassifs = await transaction.summit.findMany({
      where: options.summitIds ? { id: { in: options.summitIds } } : undefined,
      distinct: ['massif'],
      select: { massif: true },
    });
    const canonicalMassifs = await transaction.geoArea.findMany({
      where: { type: GeoAreaType.MASSIF },
      select: { id: true, name: true, parentId: true },
    });
    const massifsByName = new Map(
      canonicalMassifs.map((area) => [area.name, area]),
    );
    const northernAlpsId = areasBySlug.get('alpes-du-nord')?.id ?? null;

    for (const { massif } of legacyMassifs) {
      if (massifsByName.has(massif)) {
        continue;
      }

      const identity = getLegacyAreaIdentity(massif);
      const area = await transaction.geoArea.upsert({
        where: { slug: identity.slug },
        create: {
          id: identity.id,
          name: massif,
          slug: identity.slug,
          type: GeoAreaType.MASSIF,
          parentId: northernAlpsId,
          isPublished: true,
        },
        update: {},
        select: { id: true, name: true, parentId: true },
      });

      massifsByName.set(massif, area);
    }

    const allAreas = await transaction.geoArea.findMany({
      select: { id: true, parentId: true },
    });
    const parentByAreaId = new Map(
      allAreas.map((area) => [area.id, area.parentId]),
    );
    const summits = await transaction.summit.findMany({
      where: options.summitIds ? { id: { in: options.summitIds } } : undefined,
      select: { id: true, massif: true },
    });

    for (const summit of summits) {
      const primaryMassif = massifsByName.get(summit.massif);
      if (!primaryMassif) {
        throw new Error(`GeoArea missing for legacy massif ${summit.massif}`);
      }

      const geoAreaIds: string[] = [];
      let currentAreaId: string | null = primaryMassif.id;

      while (currentAreaId) {
        geoAreaIds.push(currentAreaId);
        currentAreaId = parentByAreaId.get(currentAreaId) ?? null;
      }

      await transaction.summitGeoArea.createMany({
        data: geoAreaIds.map((geoAreaId) => ({
          summitId: summit.id,
          geoAreaId,
        })),
        skipDuplicates: true,
      });
      await transaction.summit.update({
        where: { id: summit.id },
        data: { primaryMassifId: primaryMassif.id },
      });
    }

    return {
      geoAreas: allAreas.length,
      summits: summits.length,
    };
  });
}
