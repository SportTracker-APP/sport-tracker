import {
  GeoAreaType,
  Prisma,
  PrismaClient,
  SummitAdminAuditAction,
  SummitCatalogStatus,
  SummitCatalogTier,
  SummitExternalProvider,
} from '@prisma/client';

import { GEO_AREA_CATALOG } from '../../geography/geo-area-catalog';
import { haversineDistanceMeters } from './summit-import-matcher';
import { normalizeSummitNameForMatch } from './summit-import-source';

const WIKIDATA_API_URL = 'https://www.wikidata.org/w/api.php';
const WIKIMEDIA_USER_AGENT =
  'HOVREN summit massif curator/1.0 (https://hovren.fr)';
const MAX_ENTITY_DISTANCE_METERS = 500;
const MAX_ENTITY_ALTITUDE_DELTA_METERS = 150;
const WIKIDATA_BATCH_SIZE = 40;

type JsonRecord = Record<string, unknown>;

type MassifMapping = {
  slug: string;
  sourceRangeLabel: string;
};

const WIKIDATA_RANGE_TO_MASSIF = new Map<string, MassifMapping>([
  [
    'Q671343',
    { slug: 'massif-du-mont-blanc', sourceRangeLabel: 'massif du Mont-Blanc' },
  ],
  ['Q2732722', { slug: 'chablais', sourceRangeLabel: 'massif du Chablais' }],
  ['Q2396340', { slug: 'aravis', sourceRangeLabel: 'chaîne des Aravis' }],
  ['Q34851678', { slug: 'aravis', sourceRangeLabel: 'chaîne du Reposoir' }],
  ['Q2562471', { slug: 'bornes', sourceRangeLabel: 'massif des Bornes' }],
  ['Q3067332', { slug: 'faucigny', sourceRangeLabel: 'massif du Faucigny' }],
  ['Q2961817', { slug: 'faucigny', sourceRangeLabel: 'chaîne des Fiz' }],
  ['Q811362', { slug: 'bauges', sourceRangeLabel: 'massif des Bauges' }],
  [
    'Q2529282',
    { slug: 'beaufortain', sourceRangeLabel: 'massif du Beaufortain' },
  ],
  ['Q1451550', { slug: 'giffre', sourceRangeLabel: 'massif du Giffre' }],
  ['Q133374368', { slug: 'giffre', sourceRangeLabel: 'massif de Sixt' }],
  ['Q133374395', { slug: 'giffre', sourceRangeLabel: 'groupe du Buet' }],
  [
    'Q133374396',
    { slug: 'giffre', sourceRangeLabel: 'groupe de la Tour Salière' },
  ],
  ['Q3231926', { slug: 'giffre', sourceRangeLabel: 'dents Blanches' }],
  ['Q3297626', { slug: 'giffre', sourceRangeLabel: 'massif de Pormenaz' }],
  [
    'Q784416',
    { slug: 'aiguilles-rouges', sourceRangeLabel: 'aiguilles Rouges' },
  ],
  ['Q2961822', { slug: 'bargy', sourceRangeLabel: 'chaîne du Bargy' }],
  [
    'Q3297648',
    { slug: 'chambotte', sourceRangeLabel: 'massif de la Chambotte' },
  ],
]);

export type SummitMassifCandidate = {
  summitId: string;
  summitName: string;
  wikidataId: string;
  wikidataRevision: string;
  sourceMethod: 'OSM_WIKIDATA_REFERENCE' | 'WIKIDATA_EXACT_SEARCH';
  sourceRangeId: string;
  sourceRangeLabel: string;
  massifSlug: string;
  massifName: string;
  distanceMeters: number;
  altitudeDeltaMeters: number | null;
};

export type SummitMassifCurationResult = {
  mode: 'DRY_RUN' | 'APPLY';
  counts: {
    examined: number;
    withStoredWikidataReference: number;
    foundByExactSearch: number;
    eligible: number;
    applied: number;
    unresolved: number;
  };
  candidates: SummitMassifCandidate[];
  unresolved: Array<{
    summitId: string;
    summitName: string;
    wikidataId: string | null;
    reason:
      | 'NO_WIKIDATA_MATCH'
      | 'IDENTITY_NOT_CONFIRMED'
      | 'NO_RANGE'
      | 'MULTIPLE_RANGES'
      | 'UNMAPPED_RANGE';
  }>;
};

type SummitMassifTarget = {
  id: string;
  name: string;
  aliases: string[];
  altitude: number;
  latitude: number;
  longitude: number;
  wikidataId: string | null;
};

type WikidataIdentityMatch = {
  wikidataId: string;
  revision: string;
  distanceMeters: number;
  altitudeDeltaMeters: number | null;
  rangeIds: string[];
};

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getClaimValues(entity: JsonRecord, property: string) {
  const claims = asRecord(entity.claims);
  return asArray(claims?.[property]).flatMap((entry) => {
    const statement = asRecord(entry);
    if (statement?.rank === 'deprecated') return [];
    const mainsnak = asRecord(statement?.mainsnak);
    const dataValue = asRecord(asRecord(mainsnak?.datavalue)?.value);
    return dataValue ? [dataValue] : [];
  });
}

function getEntityNames(entity: JsonRecord) {
  const values: string[] = [];
  const labels = asRecord(entity.labels);
  const aliases = asRecord(entity.aliases);

  for (const language of ['fr', 'en']) {
    const label = stringValue(asRecord(labels?.[language])?.value);
    if (label) values.push(label);

    for (const alias of asArray(aliases?.[language])) {
      const value = stringValue(asRecord(alias)?.value);
      if (value) values.push(value);
    }
  }

  return values;
}

function getEntityCoordinate(entity: JsonRecord) {
  const coordinate = getClaimValues(entity, 'P625')[0];
  const latitude = coordinate?.latitude;
  const longitude = coordinate?.longitude;

  return typeof latitude === 'number' && typeof longitude === 'number'
    ? { latitude, longitude }
    : null;
}

function getEntityAltitude(entity: JsonRecord) {
  const quantity = getClaimValues(entity, 'P2044')[0];
  const amount = stringValue(quantity?.amount);
  const altitude = amount ? Number(amount) : Number.NaN;
  return Number.isFinite(altitude) ? Math.round(altitude) : null;
}

function getEntityRangeIds(entity: JsonRecord) {
  return getClaimValues(entity, 'P4552')
    .map(({ id }) => stringValue(id))
    .filter((id): id is string => Boolean(id));
}

function getWikidataId(value: unknown) {
  const wikidataId = stringValue(asRecord(value)?.osmWikidata);
  return wikidataId && /^Q\d+$/.test(wikidataId) ? wikidataId : null;
}

function inBatches<T>(values: T[], size: number) {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, (index + 1) * size),
  );
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchJson(url: URL) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, {
      headers: { 'User-Agent': WIKIMEDIA_USER_AGENT },
      signal: AbortSignal.timeout(20_000),
    });
    if (response.ok) return (await response.json()) as unknown;
    if (![429, 503].includes(response.status) || attempt === 3) {
      throw new Error(`Wikidata API ${response.status}`);
    }
    await wait(1_000 * 2 ** attempt);
  }

  throw new Error('Wikidata API indisponible');
}

async function fetchWikidataEntities(ids: string[]) {
  const entities = new Map<string, JsonRecord>();

  for (const batch of inBatches(ids, WIKIDATA_BATCH_SIZE)) {
    const url = new URL(WIKIDATA_API_URL);
    url.search = new URLSearchParams({
      action: 'wbgetentities',
      ids: batch.join('|'),
      props: 'claims|labels|aliases|info',
      languages: 'fr|en',
      format: 'json',
      origin: '*',
    }).toString();
    const body = asRecord(await fetchJson(url));
    const responseEntities = asRecord(body?.entities);
    for (const [id, entity] of Object.entries(responseEntities ?? {})) {
      const parsed = asRecord(entity);
      if (parsed) entities.set(id, parsed);
    }
  }

  return entities;
}

async function searchWikidataIds(name: string) {
  const url = new URL(WIKIDATA_API_URL);
  url.search = new URLSearchParams({
    action: 'wbsearchentities',
    search: name,
    language: 'fr',
    uselang: 'fr',
    type: 'item',
    limit: '5',
    format: 'json',
    origin: '*',
  }).toString();
  const body = asRecord(await fetchJson(url));
  return asArray(body?.search)
    .map((result) => stringValue(asRecord(result)?.id))
    .filter((id): id is string => Boolean(id));
}

export function matchWikidataMassifIdentity(
  target: SummitMassifTarget,
  wikidataId: string,
  entity: JsonRecord | null,
): WikidataIdentityMatch | null {
  if (!entity || entity.missing !== undefined) return null;

  const targetNames = new Set(
    [target.name, ...target.aliases].map(normalizeSummitNameForMatch),
  );
  const nameMatched = getEntityNames(entity)
    .map(normalizeSummitNameForMatch)
    .some((name) => targetNames.has(name));
  if (!nameMatched) return null;

  const coordinate = getEntityCoordinate(entity);
  if (!coordinate) return null;
  const distanceMeters = Math.round(
    haversineDistanceMeters(
      [target.longitude, target.latitude],
      [coordinate.longitude, coordinate.latitude],
    ),
  );
  if (distanceMeters > MAX_ENTITY_DISTANCE_METERS) return null;

  const entityAltitude = getEntityAltitude(entity);
  const altitudeDeltaMeters =
    entityAltitude === null ? null : Math.abs(entityAltitude - target.altitude);
  if (
    altitudeDeltaMeters !== null &&
    altitudeDeltaMeters > MAX_ENTITY_ALTITUDE_DELTA_METERS
  ) {
    return null;
  }

  const revision = entity.lastrevid;
  if (typeof revision !== 'number' && typeof revision !== 'string') return null;

  return {
    wikidataId,
    revision: String(revision),
    distanceMeters,
    altitudeDeltaMeters,
    rangeIds: getEntityRangeIds(entity),
  };
}

async function loadTargets(prisma: PrismaClient) {
  const summits = await prisma.summit.findMany({
    where: {
      isActive: true,
      catalogStatus: SummitCatalogStatus.READY,
      catalogTier: SummitCatalogTier.CORE,
      primaryMassifId: null,
    },
    select: {
      id: true,
      name: true,
      aliases: true,
      altitude: true,
      latitude: true,
      longitude: true,
      importCandidates: {
        select: { classificationSignals: true },
        orderBy: { updatedAt: 'desc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return summits.map<SummitMassifTarget>((summit) => ({
    ...summit,
    wikidataId:
      summit.importCandidates
        .map(({ classificationSignals }) =>
          getWikidataId(classificationSignals),
        )
        .find(Boolean) ?? null,
  }));
}

export async function curateSummitMassifs(
  prisma: PrismaClient,
): Promise<SummitMassifCurationResult> {
  const targets = await loadTargets(prisma);
  const withoutReference = targets.filter(({ wikidataId }) => !wikidataId);
  const searchResults = new Map<string, string[]>();

  for (const target of withoutReference) {
    searchResults.set(target.id, await searchWikidataIds(target.name));
  }

  const entityIds = Array.from(
    new Set([
      ...targets
        .map(({ wikidataId }) => wikidataId)
        .filter((id): id is string => Boolean(id)),
      ...Array.from(searchResults.values()).flat(),
    ]),
  );
  const entities = await fetchWikidataEntities(entityIds);
  const massifBySlug = new Map(
    GEO_AREA_CATALOG.filter(({ type }) => type === GeoAreaType.MASSIF).map(
      (area) => [area.slug, area],
    ),
  );
  const candidates: SummitMassifCandidate[] = [];
  const unresolved: SummitMassifCurationResult['unresolved'] = [];
  let foundByExactSearch = 0;

  for (const target of targets) {
    const sourceMethod = target.wikidataId
      ? ('OSM_WIKIDATA_REFERENCE' as const)
      : ('WIKIDATA_EXACT_SEARCH' as const);
    const possibleIds = target.wikidataId
      ? [target.wikidataId]
      : (searchResults.get(target.id) ?? []);
    const identityMatches = possibleIds.flatMap((wikidataId) => {
      const match = matchWikidataMassifIdentity(
        target,
        wikidataId,
        entities.get(wikidataId) ?? null,
      );
      return match ? [match] : [];
    });

    if (identityMatches.length !== 1) {
      unresolved.push({
        summitId: target.id,
        summitName: target.name,
        wikidataId: target.wikidataId,
        reason: target.wikidataId
          ? 'IDENTITY_NOT_CONFIRMED'
          : 'NO_WIKIDATA_MATCH',
      });
      continue;
    }

    const match = identityMatches[0];
    if (!target.wikidataId) foundByExactSearch += 1;
    if (match.rangeIds.length === 0) {
      unresolved.push({
        summitId: target.id,
        summitName: target.name,
        wikidataId: match.wikidataId,
        reason: 'NO_RANGE',
      });
      continue;
    }
    if (match.rangeIds.length > 1) {
      unresolved.push({
        summitId: target.id,
        summitName: target.name,
        wikidataId: match.wikidataId,
        reason: 'MULTIPLE_RANGES',
      });
      continue;
    }

    const sourceRangeId = match.rangeIds[0];
    const mapping = WIKIDATA_RANGE_TO_MASSIF.get(sourceRangeId);
    const massif = mapping ? massifBySlug.get(mapping.slug) : null;
    if (!mapping || !massif) {
      unresolved.push({
        summitId: target.id,
        summitName: target.name,
        wikidataId: match.wikidataId,
        reason: 'UNMAPPED_RANGE',
      });
      continue;
    }

    candidates.push({
      summitId: target.id,
      summitName: target.name,
      wikidataId: match.wikidataId,
      wikidataRevision: match.revision,
      sourceMethod,
      sourceRangeId,
      sourceRangeLabel: mapping.sourceRangeLabel,
      massifSlug: massif.slug,
      massifName: massif.name,
      distanceMeters: match.distanceMeters,
      altitudeDeltaMeters: match.altitudeDeltaMeters,
    });
  }

  return {
    mode: 'DRY_RUN',
    counts: {
      examined: targets.length,
      withStoredWikidataReference: targets.length - withoutReference.length,
      foundByExactSearch,
      eligible: candidates.length,
      applied: 0,
      unresolved: unresolved.length,
    },
    candidates,
    unresolved,
  };
}

function getCatalogMassif(slug: string) {
  const area = GEO_AREA_CATALOG.find(
    (entry) => entry.slug === slug && entry.type === GeoAreaType.MASSIF,
  );
  if (!area) throw new Error(`Massif HOVREN absent du catalogue : ${slug}`);
  return area;
}

export async function applySummitMassifCandidates(
  prisma: PrismaClient,
  candidates: SummitMassifCandidate[],
) {
  return prisma.$transaction(
    async (transaction) => {
      const northernAlps = await transaction.geoArea.findUnique({
        where: { slug: 'alpes-du-nord' },
        select: { id: true },
      });
      if (!northernAlps) throw new Error('GeoArea Alpes du Nord introuvable');

      const uniqueSlugs = Array.from(
        new Set(candidates.map(({ massifSlug }) => massifSlug)),
      );
      const massifBySlug = new Map<string, { id: string; name: string }>();
      for (const slug of uniqueSlugs) {
        const catalogMassif = getCatalogMassif(slug);
        const massif = await transaction.geoArea.upsert({
          where: { slug },
          create: {
            id: catalogMassif.id,
            name: catalogMassif.name,
            slug,
            type: GeoAreaType.MASSIF,
            parentId: northernAlps.id,
            isPublished: true,
          },
          update: {
            name: catalogMassif.name,
            type: GeoAreaType.MASSIF,
            parentId: northernAlps.id,
            isPublished: true,
          },
          select: { id: true, name: true },
        });
        if (massif.id !== catalogMassif.id) {
          throw new Error(`Identifiant GeoArea inattendu pour ${slug}`);
        }
        massifBySlug.set(slug, massif);
      }

      const allAreas = await transaction.geoArea.findMany({
        select: { id: true, parentId: true, type: true },
      });
      const areaById = new Map(allAreas.map((area) => [area.id, area]));
      let applied = 0;

      for (const candidate of candidates) {
        const massif = massifBySlug.get(candidate.massifSlug);
        if (!massif)
          throw new Error(`Massif non préparé : ${candidate.massifSlug}`);
        const summit = await transaction.summit.findUnique({
          where: { id: candidate.summitId },
          select: {
            id: true,
            name: true,
            massif: true,
            primaryMassifId: true,
            isActive: true,
            catalogStatus: true,
            catalogTier: true,
            geoAreas: {
              where: { geoArea: { type: GeoAreaType.MASSIF } },
              select: { geoAreaId: true },
            },
          },
        });
        if (!summit)
          throw new Error(`Sommet introuvable : ${candidate.summitId}`);
        if (
          !summit.isActive ||
          summit.catalogStatus !== SummitCatalogStatus.READY ||
          summit.catalogTier !== SummitCatalogTier.CORE
        ) {
          throw new Error(`Sommet devenu non public : ${summit.name}`);
        }
        if (summit.primaryMassifId && summit.primaryMassifId !== massif.id) {
          throw new Error(
            `Massif déjà administré différemment : ${summit.name}`,
          );
        }
        if (summit.geoAreas.some(({ geoAreaId }) => geoAreaId !== massif.id)) {
          throw new Error(`Lien massif déjà incohérent : ${summit.name}`);
        }

        const hierarchyIds: string[] = [];
        const visited = new Set<string>();
        let currentId: string | null = massif.id;
        while (currentId && !visited.has(currentId)) {
          hierarchyIds.push(currentId);
          visited.add(currentId);
          currentId = areaById.get(currentId)?.parentId ?? null;
        }

        await transaction.summitGeoArea.createMany({
          data: hierarchyIds.map((geoAreaId) => ({
            summitId: summit.id,
            geoAreaId,
          })),
          skipDuplicates: true,
        });
        const existingWikidataReference =
          await transaction.summitExternalReference.findUnique({
            where: {
              provider_externalId: {
                provider: SummitExternalProvider.WIKIDATA,
                externalId: candidate.wikidataId,
              },
            },
            select: { summitId: true },
          });
        if (
          existingWikidataReference &&
          existingWikidataReference.summitId !== summit.id
        ) {
          throw new Error(
            `Référence Wikidata déjà liée à un autre sommet : ${candidate.wikidataId}`,
          );
        }
        await transaction.summitExternalReference.upsert({
          where: {
            provider_externalId: {
              provider: SummitExternalProvider.WIKIDATA,
              externalId: candidate.wikidataId,
            },
          },
          create: {
            summitId: summit.id,
            provider: SummitExternalProvider.WIKIDATA,
            externalId: candidate.wikidataId,
            sourceVersion: candidate.wikidataRevision,
            sourceName: 'Wikidata P4552',
          },
          update: {
            sourceVersion: candidate.wikidataRevision,
            sourceName: 'Wikidata P4552',
            lastSeenAt: new Date(),
          },
        });

        if (!summit.primaryMassifId) {
          await transaction.summit.update({
            where: { id: summit.id },
            data: { massif: massif.name, primaryMassifId: massif.id },
          });
          await transaction.summitAdminAuditLog.create({
            data: {
              summitId: summit.id,
              action: SummitAdminAuditAction.PRIMARY_MASSIF_CHANGED,
              before: {
                massif: summit.massif,
                primaryMassifId: null,
              } satisfies Prisma.InputJsonValue,
              after: {
                massif: massif.name,
                primaryMassifId: massif.id,
                source: 'WIKIDATA_P4552',
                wikidataId: candidate.wikidataId,
                wikidataRevision: candidate.wikidataRevision,
                sourceRangeId: candidate.sourceRangeId,
                sourceRangeLabel: candidate.sourceRangeLabel,
                sourceMethod: candidate.sourceMethod,
                distanceMeters: candidate.distanceMeters,
                altitudeDeltaMeters: candidate.altitudeDeltaMeters,
              } satisfies Prisma.InputJsonValue,
            },
          });
          applied += 1;
        }
      }

      return applied;
    },
    { maxWait: 10_000, timeout: 120_000 },
  );
}

export async function getSummitMassifQa(prisma: PrismaClient) {
  const publicWhere = {
    isActive: true,
    catalogStatus: SummitCatalogStatus.READY,
    catalogTier: SummitCatalogTier.CORE,
  } as const;
  const [publicSummits, missingPrimaryMassif] = await Promise.all([
    prisma.summit.count({ where: publicWhere }),
    prisma.summit.count({
      where: { ...publicWhere, primaryMassifId: null },
    }),
  ]);

  const rawInconsistencies = await prisma.$queryRaw<
    Array<{
      mismatchedLabel: number;
      missingLink: number;
      invalidMassif: number;
      missingHierarchy: number;
    }>
  >(Prisma.sql`
    WITH RECURSIVE public_summits AS (
      SELECT s."id", s."massif", s."primaryMassifId"
      FROM "Summit" s
      WHERE s."isActive" = true
        AND s."catalogStatus" = 'READY'::"SummitCatalogStatus"
        AND s."catalogTier" = 'CORE'::"SummitCatalogTier"
        AND s."primaryMassifId" IS NOT NULL
    ), massif_quality AS (
      SELECT
        COUNT(*) FILTER (WHERE s."massif" <> area."name")::int AS "mismatchedLabel",
        COUNT(*) FILTER (WHERE link."summitId" IS NULL)::int AS "missingLink",
        COUNT(*) FILTER (
          WHERE area."type" <> 'MASSIF'::"GeoAreaType" OR area."isPublished" = false
        )::int AS "invalidMassif"
      FROM public_summits s
      JOIN "GeoArea" area ON area."id" = s."primaryMassifId"
      LEFT JOIN "SummitGeoArea" link
        ON link."summitId" = s."id" AND link."geoAreaId" = s."primaryMassifId"
    ), ancestors AS (
      SELECT s."id" AS "summitId", area."id" AS "geoAreaId", area."parentId"
      FROM public_summits s
      JOIN "GeoArea" area ON area."id" = s."primaryMassifId"
      UNION ALL
      SELECT ancestors."summitId", parent."id", parent."parentId"
      FROM ancestors
      JOIN "GeoArea" parent ON parent."id" = ancestors."parentId"
    ), hierarchy_quality AS (
      SELECT COUNT(*)::int AS "missingHierarchy"
      FROM ancestors
      LEFT JOIN "SummitGeoArea" link
        ON link."summitId" = ancestors."summitId"
       AND link."geoAreaId" = ancestors."geoAreaId"
      WHERE link."summitId" IS NULL
    )
    SELECT massif_quality.*, hierarchy_quality."missingHierarchy"
    FROM massif_quality CROSS JOIN hierarchy_quality
  `);

  return {
    publicSummits,
    missingPrimaryMassif,
    mismatchedLabel: rawInconsistencies[0]?.mismatchedLabel ?? 0,
    missingLink: rawInconsistencies[0]?.missingLink ?? 0,
    invalidMassif: rawInconsistencies[0]?.invalidMassif ?? 0,
    missingHierarchy: rawInconsistencies[0]?.missingHierarchy ?? 0,
  };
}

export function isKnownMassifCandidate(candidate: SummitMassifCandidate) {
  const mapping = WIKIDATA_RANGE_TO_MASSIF.get(candidate.sourceRangeId);
  return (
    Boolean(mapping) &&
    mapping?.slug === candidate.massifSlug &&
    getCatalogMassif(candidate.massifSlug).name === candidate.massifName &&
    /^Q\d+$/.test(candidate.wikidataId) &&
    candidate.distanceMeters >= 0 &&
    candidate.distanceMeters <= MAX_ENTITY_DISTANCE_METERS &&
    (candidate.altitudeDeltaMeters === null ||
      (candidate.altitudeDeltaMeters >= 0 &&
        candidate.altitudeDeltaMeters <= MAX_ENTITY_ALTITUDE_DELTA_METERS))
  );
}
