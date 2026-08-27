import {
  PrismaClient,
  SummitCatalogStatus,
  SummitCatalogTier,
} from '@prisma/client';

import { haversineDistanceMeters } from './summit-import-matcher';
import { normalizeSummitNameForMatch } from './summit-import-source';

const WIKIDATA_API_URL = 'https://www.wikidata.org/w/api.php';
const COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';
const WIKIMEDIA_USER_AGENT =
  'HOVREN summit photo curator/1.0 (https://hovren.fr)';
const MAX_ENTITY_DISTANCE_METERS = 500;
const MAX_ENTITY_ALTITUDE_DELTA_METERS = 150;
const MAX_COMMONS_CAMERA_DISTANCE_METERS = 75_000;
const WIKIDATA_BATCH_SIZE = 40;
const COMMONS_BATCH_SIZE = 50;
const UNSUITABLE_COMMONS_FILES = new Set(
  [
    'Forêt @ Sous le Mont Baret (51140610891).jpg',
    'Mont Truc @ Sommet @ Mont Vorassay (50726972461).jpg',
    "Télécabine du Bettex-Mont d'Arbois and Télésiège des Nants climbing Mont d'Arbois side by side, Saint-Gervais-les-Bains, 2025.jpg",
  ].map(normalizeCommonsFileName),
);
const SUMMITS_WITHOUT_RELIABLE_COMMONS_SEARCH_PHOTO = new Set(
  ['Mont Baret'].map(normalizeSummitNameForMatch),
);

type JsonRecord = Record<string, unknown>;

export type SummitPhotoCandidate = {
  summitId: string;
  summitName: string;
  wikidataId: string | null;
  sourceMethod: 'WIKIDATA_P18' | 'COMMONS_EXACT_SEARCH';
  commonsFile: string;
  imageUrl: string;
  imageCredit: string;
  sourceUrl: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  distanceMeters: number | null;
};

export type SummitPhotoCurationResult = {
  mode: 'DRY_RUN' | 'APPLY';
  counts: {
    examined: number;
    withWikidataReference: number;
    eligibleFromWikidata: number;
    eligibleFromCommonsSearch: number;
    eligible: number;
    applied: number;
    skipped: number;
  };
  candidates: SummitPhotoCandidate[];
  skipped: Array<{
    summitId: string;
    summitName: string;
    wikidataId: string | null;
    reason: string;
  }>;
};

export async function applySummitPhotoCandidates(
  prisma: PrismaClient,
  candidates: SummitPhotoCandidate[],
) {
  let applied = 0;

  await prisma.$transaction(async (transaction) => {
    for (const candidate of candidates) {
      const result = await transaction.summit.updateMany({
        where: {
          id: candidate.summitId,
          imageUrl: null,
          editorialImageUrl: null,
        },
        data: {
          imageUrl: candidate.imageUrl,
          imageCredit: candidate.imageCredit,
          sourceUrl: candidate.sourceUrl,
        },
      });
      applied += result.count;
    }
  });

  return applied;
}

type SummitPhotoTarget = {
  id: string;
  name: string;
  aliases: string[];
  altitude: number;
  latitude: number;
  longitude: number;
  wikidataId: string | null;
  hasUniqueName: boolean;
};

type WikidataPhotoMatch = {
  wikidataId: string;
  commonsFile: string;
  distanceMeters: number;
};

type CommonsPhotoMetadata = {
  commonsFile: string;
  imageUrl: string;
  sourceUrl: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  description: string | null;
  categories: string[];
  cameraLatitude: number | null;
  cameraLongitude: number | null;
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

function metadataValue(metadata: JsonRecord, key: string) {
  return stringValue(asRecord(metadata[key])?.value);
}

function numericMetadataValue(metadata: JsonRecord, key: string) {
  const value = Number(metadataValue(metadata, key));
  return Number.isFinite(value) ? value : null;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function cleanCommonsText(value: string | null, maxLength: number) {
  if (!value) return null;

  const cleaned = decodeHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, ' · ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned && cleaned.length <= maxLength ? cleaned : null;
}

export function cleanCommonsAttribution(value: string | null) {
  return cleanCommonsText(value, 200);
}

export function isSupportedCommonsLicense(value: string | null) {
  if (!value) return false;

  const normalized = value
    .toUpperCase()
    .replace(/[_–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized.includes('-NC') || normalized.includes('-ND')) return false;

  return (
    normalized.startsWith('CC BY ') ||
    normalized.startsWith('CC BY-SA ') ||
    normalized === 'CC0' ||
    normalized.startsWith('CC0 ') ||
    normalized === 'PUBLIC DOMAIN' ||
    normalized === 'PD' ||
    normalized.startsWith('PD-')
  );
}

function getClaimValue(entity: JsonRecord, property: string) {
  const claims = asRecord(entity.claims);
  const claim = asArray(claims?.[property]).find(
    (entry) => asRecord(entry)?.rank !== 'deprecated',
  );
  const mainsnak = asRecord(asRecord(claim)?.mainsnak);
  const dataValue = asRecord(mainsnak?.datavalue);
  return dataValue?.value;
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
  const coordinate = asRecord(getClaimValue(entity, 'P625'));
  const latitude = coordinate?.latitude;
  const longitude = coordinate?.longitude;

  return typeof latitude === 'number' && typeof longitude === 'number'
    ? { latitude, longitude }
    : null;
}

function getEntityAltitude(entity: JsonRecord) {
  const quantity = asRecord(getClaimValue(entity, 'P2044'));
  const amount = stringValue(quantity?.amount);
  const numericAmount = amount ? Number(amount) : Number.NaN;
  return Number.isFinite(numericAmount) ? Math.round(numericAmount) : null;
}

function commonsTextIdentifiesSummit(
  value: string,
  summitName: string,
  summitAliases: string[],
) {
  const normalizedValue = normalizeSummitNameForMatch(
    value.replace(/\.[a-z0-9]{2,5}$/i, ''),
  );

  return [summitName, ...summitAliases]
    .map(normalizeSummitNameForMatch)
    .filter((name) => name.length >= 5)
    .some((name) => normalizedValue.includes(name));
}

export function commonsPhotoIdentifiesSummit(
  photo: Pick<CommonsPhotoMetadata, 'commonsFile' | 'description'>,
  target: Pick<SummitPhotoTarget, 'name' | 'aliases'>,
) {
  return (
    commonsTextIdentifiesSummit(
      photo.commonsFile,
      target.name,
      target.aliases,
    ) ||
    (photo.description !== null &&
      commonsTextIdentifiesSummit(
        photo.description,
        target.name,
        target.aliases,
      ))
  );
}

export function commonsSearchPhotoIsReliable(
  photo: Pick<
    CommonsPhotoMetadata,
    | 'commonsFile'
    | 'description'
    | 'categories'
    | 'cameraLatitude'
    | 'cameraLongitude'
  >,
  target: Pick<
    SummitPhotoTarget,
    'name' | 'aliases' | 'latitude' | 'longitude'
  >,
) {
  if (
    SUMMITS_WITHOUT_RELIABLE_COMMONS_SEARCH_PHOTO.has(
      normalizeSummitNameForMatch(target.name),
    )
  ) {
    return false;
  }
  if (
    UNSUITABLE_COMMONS_FILES.has(normalizeCommonsFileName(photo.commonsFile))
  ) {
    return false;
  }
  if (!commonsPhotoIdentifiesSummit(photo, target)) return false;
  if (photo.cameraLatitude === null || photo.cameraLongitude === null) {
    return false;
  }

  const normalizedTargetNames = new Set(
    [target.name, ...target.aliases]
      .map(normalizeSummitNameForMatch)
      .filter((name) => name.length >= 5),
  );
  const hasExactSummitCategory = photo.categories.some((category) =>
    normalizedTargetNames.has(normalizeSummitNameForMatch(category)),
  );
  if (!hasExactSummitCategory) return false;

  return (
    haversineDistanceMeters(
      [target.longitude, target.latitude],
      [photo.cameraLongitude, photo.cameraLatitude],
    ) <= MAX_COMMONS_CAMERA_DISTANCE_METERS
  );
}

export function matchWikidataPhoto(
  target: SummitPhotoTarget,
  entity: JsonRecord | null,
): WikidataPhotoMatch | null {
  if (!entity || entity.missing !== undefined || !target.wikidataId) {
    return null;
  }

  const targetNames = new Set(
    [target.name, ...target.aliases].map(normalizeSummitNameForMatch),
  );
  const entityNames = getEntityNames(entity).map(normalizeSummitNameForMatch);
  if (!entityNames.some((name) => targetNames.has(name))) return null;

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
  if (
    entityAltitude !== null &&
    Math.abs(entityAltitude - target.altitude) >
      MAX_ENTITY_ALTITUDE_DELTA_METERS
  ) {
    return null;
  }

  const commonsFile = stringValue(getClaimValue(entity, 'P18'));
  if (!commonsFile) return null;

  return {
    wikidataId: target.wikidataId,
    commonsFile,
    distanceMeters,
  };
}

export function parseCommonsPhotoMetadata(
  commonsFile: string,
  page: JsonRecord | null,
): CommonsPhotoMetadata | null {
  const imageInfo = asRecord(asArray(page?.imageinfo)[0]);
  const metadata = asRecord(imageInfo?.extmetadata);
  if (!imageInfo || !metadata) return null;

  const imageUrl =
    stringValue(imageInfo.thumburl) ?? stringValue(imageInfo.url);
  const sourceUrl = stringValue(imageInfo.descriptionurl);
  const mime = stringValue(imageInfo.mime);
  const license =
    metadataValue(metadata, 'LicenseShortName') ??
    metadataValue(metadata, 'UsageTerms');
  const licenseUrl = metadataValue(metadata, 'LicenseUrl');
  const categories = (metadataValue(metadata, 'Categories') ?? '')
    .split('|')
    .map((category) => category.trim())
    .filter(Boolean);
  const cameraLatitude = numericMetadataValue(metadata, 'GPSLatitude');
  const cameraLongitude = numericMetadataValue(metadata, 'GPSLongitude');
  const description = cleanCommonsText(
    metadataValue(metadata, 'ImageDescription') ??
      metadataValue(metadata, 'ObjectName'),
    1_000,
  );
  const author =
    cleanCommonsAttribution(metadataValue(metadata, 'Artist')) ??
    cleanCommonsAttribution(metadataValue(metadata, 'Credit')) ??
    cleanCommonsAttribution(stringValue(imageInfo.user));

  if (
    !imageUrl ||
    !sourceUrl ||
    !author ||
    !isSupportedCommonsLicense(license) ||
    (mime !== null && !['image/jpeg', 'image/png', 'image/webp'].includes(mime))
  ) {
    return null;
  }

  return {
    commonsFile,
    imageUrl,
    sourceUrl,
    author,
    license: license!,
    licenseUrl,
    description,
    categories,
    cameraLatitude,
    cameraLongitude,
  };
}

function getWikidataId(value: unknown) {
  const wikidataId = stringValue(asRecord(value)?.osmWikidata);
  return wikidataId && /^Q\d+$/.test(wikidataId) ? wikidataId : null;
}

function inBatches<T>(values: T[], batchSize: number) {
  return Array.from(
    { length: Math.ceil(values.length / batchSize) },
    (_, index) => values.slice(index * batchSize, (index + 1) * batchSize),
  );
}

function normalizeCommonsFileName(value: string) {
  return value.replace(/_/g, ' ').trim().toLocaleLowerCase('en');
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
    if (response.ok) {
      if (url.hostname === 'commons.wikimedia.org') await wait(120);
      return (await response.json()) as unknown;
    }
    if (![429, 503].includes(response.status) || attempt === 3) {
      throw new Error(`Wikimedia API ${response.status} sur ${url.hostname}`);
    }

    const retryAfterSeconds = Number(response.headers.get('retry-after'));
    await wait(
      Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? Math.min(retryAfterSeconds * 1_000, 15_000)
        : 1_000 * 2 ** attempt,
    );
  }

  throw new Error(`Wikimedia API indisponible sur ${url.hostname}`);
}

async function fetchWikidataEntities(ids: string[]) {
  const entities = new Map<string, JsonRecord>();

  for (const batch of inBatches(ids, WIKIDATA_BATCH_SIZE)) {
    const url = new URL(WIKIDATA_API_URL);
    url.search = new URLSearchParams({
      action: 'wbgetentities',
      ids: batch.join('|'),
      props: 'claims|labels|aliases',
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

async function fetchCommonsMetadata(files: string[]) {
  const metadataByFile = new Map<string, CommonsPhotoMetadata>();

  for (const batch of inBatches(files, COMMONS_BATCH_SIZE)) {
    const url = new URL(COMMONS_API_URL);
    url.search = new URLSearchParams({
      action: 'query',
      prop: 'imageinfo',
      titles: batch.map((file) => `File:${file}`).join('|'),
      iiprop: 'url|extmetadata|mime|user',
      iiurlwidth: '1600',
      redirects: '1',
      format: 'json',
      formatversion: '2',
      origin: '*',
    }).toString();
    const body = asRecord(await fetchJson(url));
    const query = asRecord(body?.query);
    for (const pageValue of asArray(query?.pages)) {
      const page = asRecord(pageValue);
      const title = stringValue(page?.title);
      const commonsFile = title?.replace(/^File:/, '') ?? null;
      if (!commonsFile) continue;
      const parsed = parseCommonsPhotoMetadata(commonsFile, page);
      if (parsed) {
        metadataByFile.set(normalizeCommonsFileName(commonsFile), parsed);
      }
    }
  }

  return metadataByFile;
}

async function mapWithConcurrency<T, Result>(
  values: T[],
  concurrency: number,
  worker: (value: T) => Promise<Result>,
) {
  const results = new Array<Result>(values.length);
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (nextIndex < values.length) {
        const index = nextIndex;
        nextIndex += 1;
        results[index] = await worker(values[index]);
      }
    }),
  );

  return results;
}

async function searchCommonsFileNames(targets: SummitPhotoTarget[]) {
  const entries = await mapWithConcurrency(targets, 1, async (target) => {
    const searchName = target.name.replace(/["\\]/g, ' ').trim();
    const url = new URL(COMMONS_API_URL);
    url.search = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: `intitle:"${searchName}"`,
      srnamespace: '6',
      srlimit: '5',
      srprop: '',
      format: 'json',
      formatversion: '2',
      origin: '*',
    }).toString();
    const body = asRecord(await fetchJson(url));
    const query = asRecord(body?.query);
    const files = asArray(query?.search)
      .map((result) => stringValue(asRecord(result)?.title))
      .filter((title): title is string => Boolean(title))
      .map((title) => title.replace(/^File:/, ''));

    return [target.id, files] as const;
  });

  return new Map(entries);
}

async function loadTargets(prisma: PrismaClient, limit?: number) {
  const publicWhere = {
    isActive: true,
    catalogStatus: SummitCatalogStatus.READY,
    catalogTier: SummitCatalogTier.CORE,
  } as const;
  const [summits, publicSummitNames] = await Promise.all([
    prisma.summit.findMany({
      where: {
        ...publicWhere,
        imageUrl: null,
        editorialImageUrl: null,
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
      ...(limit ? { take: limit } : {}),
    }),
    prisma.summit.findMany({
      where: publicWhere,
      select: { name: true },
    }),
  ]);
  const nameCounts = publicSummitNames.reduce<Map<string, number>>(
    (counts, summit) => {
      const name = normalizeSummitNameForMatch(summit.name);
      counts.set(name, (counts.get(name) ?? 0) + 1);
      return counts;
    },
    new Map(),
  );

  return summits.map<SummitPhotoTarget>((summit) => ({
    id: summit.id,
    name: summit.name,
    aliases: summit.aliases,
    altitude: summit.altitude,
    latitude: summit.latitude,
    longitude: summit.longitude,
    hasUniqueName:
      nameCounts.get(normalizeSummitNameForMatch(summit.name)) === 1,
    wikidataId:
      summit.importCandidates
        .map(({ classificationSignals }) =>
          getWikidataId(classificationSignals),
        )
        .find(Boolean) ?? null,
  }));
}

export async function curateSummitPhotos(
  prisma: PrismaClient,
  options: { apply: boolean; limit?: number },
): Promise<SummitPhotoCurationResult> {
  const targets = await loadTargets(prisma, options.limit);
  const withReference = targets.filter(({ wikidataId }) => wikidataId);
  const entities = await fetchWikidataEntities(
    Array.from(
      new Set(
        withReference
          .map(({ wikidataId }) => wikidataId)
          .filter((value): value is string => Boolean(value)),
      ),
    ),
  );
  const matches = withReference.flatMap((target) => {
    const match = matchWikidataPhoto(
      target,
      entities.get(target.wikidataId!) ?? null,
    );
    return match ? [{ target, match }] : [];
  });
  const commonsMetadata = await fetchCommonsMetadata(
    Array.from(new Set(matches.map(({ match }) => match.commonsFile))),
  );
  const wikidataCandidates = matches.flatMap<SummitPhotoCandidate>(
    ({ target, match }) => {
      const photo = commonsMetadata.get(
        normalizeCommonsFileName(match.commonsFile),
      );
      if (!photo || !commonsPhotoIdentifiesSummit(photo, target)) {
        return [];
      }

      return [
        {
          summitId: target.id,
          summitName: target.name,
          wikidataId: match.wikidataId,
          sourceMethod: 'WIKIDATA_P18',
          commonsFile: photo.commonsFile,
          imageUrl: photo.imageUrl,
          imageCredit:
            photo.license.toUpperCase() === 'PUBLIC DOMAIN'
              ? `${photo.author} · Domaine public`
              : `© ${photo.author} · ${photo.license}`,
          sourceUrl: photo.sourceUrl,
          author: photo.author,
          license: photo.license,
          licenseUrl: photo.licenseUrl,
          distanceMeters: match.distanceMeters,
        },
      ];
    },
  );
  const wikidataCandidateIds = new Set(
    wikidataCandidates.map(({ summitId }) => summitId),
  );
  const exactSearchTargets = targets.filter(
    ({ id, hasUniqueName }) => hasUniqueName && !wikidataCandidateIds.has(id),
  );
  const searchResults = await searchCommonsFileNames(exactSearchTargets);
  const searchedFiles = Array.from(
    new Set(Array.from(searchResults.values()).flat()),
  );
  const searchedMetadata = await fetchCommonsMetadata(searchedFiles);
  const existingSources = new Set(
    (
      await prisma.summit.findMany({
        where: { sourceUrl: { not: null } },
        select: { sourceUrl: true },
      })
    )
      .map(({ sourceUrl }) => sourceUrl)
      .filter((sourceUrl): sourceUrl is string => Boolean(sourceUrl)),
  );
  const selectedSources = new Set(
    wikidataCandidates.map(({ sourceUrl }) => sourceUrl),
  );
  const commonsSearchCandidates =
    exactSearchTargets.flatMap<SummitPhotoCandidate>((target) => {
      const photo = (searchResults.get(target.id) ?? [])
        .map((file) => searchedMetadata.get(normalizeCommonsFileName(file)))
        .find(
          (candidate) =>
            candidate &&
            commonsSearchPhotoIsReliable(candidate, target) &&
            !existingSources.has(candidate.sourceUrl) &&
            !selectedSources.has(candidate.sourceUrl),
        );
      if (!photo) return [];

      selectedSources.add(photo.sourceUrl);
      return [
        {
          summitId: target.id,
          summitName: target.name,
          wikidataId: target.wikidataId,
          sourceMethod: 'COMMONS_EXACT_SEARCH',
          commonsFile: photo.commonsFile,
          imageUrl: photo.imageUrl,
          imageCredit:
            photo.license.toUpperCase() === 'PUBLIC DOMAIN'
              ? `${photo.author} · Domaine public`
              : `© ${photo.author} · ${photo.license}`,
          sourceUrl: photo.sourceUrl,
          author: photo.author,
          license: photo.license,
          licenseUrl: photo.licenseUrl,
          distanceMeters: null,
        },
      ];
    });
  const candidates = [...wikidataCandidates, ...commonsSearchCandidates];

  let applied = 0;
  if (options.apply) {
    applied = await applySummitPhotoCandidates(prisma, candidates);
  }

  const candidateSummitIds = new Set(
    candidates.map(({ summitId }) => summitId),
  );
  const matchedSummitIds = new Set(matches.map(({ target }) => target.id));
  const skipped = targets
    .filter(({ id }) => !candidateSummitIds.has(id))
    .map((target) => ({
      summitId: target.id,
      summitName: target.name,
      wikidataId: target.wikidataId,
      reason: !target.wikidataId
        ? 'NO_WIKIDATA_REFERENCE'
        : !matchedSummitIds.has(target.id)
          ? 'IDENTITY_OR_PHOTO_NOT_CONFIRMED'
          : 'LICENSE_OR_ATTRIBUTION_NOT_SUPPORTED',
    }));

  return {
    mode: options.apply ? 'APPLY' : 'DRY_RUN',
    counts: {
      examined: targets.length,
      withWikidataReference: withReference.length,
      eligibleFromWikidata: wikidataCandidates.length,
      eligibleFromCommonsSearch: commonsSearchCandidates.length,
      eligible: candidates.length,
      applied,
      skipped: skipped.length,
    },
    candidates,
    skipped,
  };
}
