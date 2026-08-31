import { access } from 'node:fs/promises';
import path from 'node:path';

import type { Feature, MultiPolygon, Point, Polygon } from 'geojson';
import proj4 from 'proj4';
import { open } from 'shapefile';

import { IGN_SUMMIT_NATURES } from './summit-import.constants';
import {
  ignDepartmentPropertiesSchema,
  ignDetailPropertiesSchema,
  ignToponymPropertiesSchema,
  normalizedIgnSummitSchema,
  type IgnSnapshotReadResult,
  type ImportRejectedFeature,
  type NormalizedIgnSummit,
} from './summit-import.types';

const LAMBERT_93 =
  '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +units=m +no_defs';

proj4.defs('EPSG:2154', LAMBERT_93);

type SnapshotPaths = {
  detailBase: string;
  toponymBase: string;
  departmentBase: string;
};

function getSnapshotPaths(snapshotDirectory: string): SnapshotPaths {
  return {
    detailBase: path.join(
      snapshotDirectory,
      'LIEUX_NOMMES',
      'DETAIL_OROGRAPHIQUE',
    ),
    toponymBase: path.join(snapshotDirectory, 'LIEUX_NOMMES', 'TOPONYMIE'),
    departmentBase: path.join(
      snapshotDirectory,
      'ADMINISTRATIF',
      'DEPARTEMENT',
    ),
  };
}

async function assertShapefile(basePath: string) {
  await Promise.all([access(`${basePath}.shp`), access(`${basePath}.dbf`)]);
}

async function readFeatures(basePath: string): Promise<Feature[]> {
  const source = await open(`${basePath}.shp`, `${basePath}.dbf`, {
    encoding: 'utf-8',
  });
  const features: Feature[] = [];

  for (;;) {
    const result = await source.read();
    if (result.done) break;
    features.push(result.value);
  }

  return features;
}

export function isPointFeature(feature: Feature): feature is Feature<Point> {
  return feature.geometry?.type === 'Point';
}

export function isIgnSummitNature(value: string) {
  return (IGN_SUMMIT_NATURES as readonly string[]).includes(value);
}

function isDepartmentFeature(
  feature: Feature,
): feature is Feature<Polygon | MultiPolygon> {
  return (
    feature.geometry?.type === 'Polygon' ||
    feature.geometry?.type === 'MultiPolygon'
  );
}

function pointInRing(point: number[], ring: number[][]) {
  const [x, y] = point;
  let inside = false;

  for (
    let index = 0, previous = ring.length - 1;
    index < ring.length;
    previous = index++
  ) {
    const [currentX, currentY] = ring[index];
    const [previousX, previousY] = ring[previous];
    const intersects =
      currentY > y !== previousY > y &&
      x <
        ((previousX - currentX) * (y - currentY)) / (previousY - currentY) +
          currentX;

    if (intersects) inside = !inside;
  }

  return inside;
}

function pointInPolygon(point: number[], polygon: number[][][]) {
  return (
    pointInRing(point, polygon[0]) &&
    !polygon.slice(1).some((ring) => pointInRing(point, ring))
  );
}

function getPolygons(geometry: Polygon | MultiPolygon) {
  return geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.coordinates;
}

function pointInDepartment(point: number[], geometry: Polygon | MultiPolygon) {
  return getPolygons(geometry).some((polygon) =>
    pointInPolygon(point, polygon),
  );
}

function segmentDistance(point: number[], start: number[], end: number[]) {
  const deltaX = end[0] - start[0];
  const deltaY = end[1] - start[1];
  const squaredLength = deltaX * deltaX + deltaY * deltaY;

  if (squaredLength === 0) {
    return Math.hypot(point[0] - start[0], point[1] - start[1]);
  }

  const ratio = Math.max(
    0,
    Math.min(
      1,
      ((point[0] - start[0]) * deltaX + (point[1] - start[1]) * deltaY) /
        squaredLength,
    ),
  );

  return Math.hypot(
    point[0] - (start[0] + ratio * deltaX),
    point[1] - (start[1] + ratio * deltaY),
  );
}

function distanceToDepartmentBoundary(
  point: number[],
  geometry: Polygon | MultiPolygon,
) {
  let minimumDistance = Number.POSITIVE_INFINITY;

  for (const polygon of getPolygons(geometry)) {
    for (const ring of polygon) {
      for (let index = 1; index < ring.length; index += 1) {
        minimumDistance = Math.min(
          minimumDistance,
          segmentDistance(point, ring[index - 1], ring[index]),
        );
      }
    }
  }

  return minimumDistance;
}

export function normalizeSummitName(value: string) {
  return value.normalize('NFC').replace(/\s+/g, ' ').trim();
}

export function normalizeSummitNameForMatch(value: string) {
  return normalizeSummitName(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('fr-FR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function numericPrecision(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function jsonSourceProperties(properties: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(properties).flatMap(([key, value]) =>
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
        ? [[key, value]]
        : [],
    ),
  );
}

async function readToponyms(toponymBase: string) {
  const aliasesByExternalId = new Map<string, string[]>();

  for (const feature of await readFeatures(toponymBase)) {
    const result = ignToponymPropertiesSchema.safeParse(feature.properties);
    if (!result.success || result.data.CLASSE !== 'Détail orographique') {
      continue;
    }

    const graphie = result.data.GRAPHIE
      ? normalizeSummitName(result.data.GRAPHIE)
      : '';
    if (!graphie) continue;

    const aliases = aliasesByExternalId.get(result.data.ID) ?? [];
    if (
      !aliases.some(
        (alias) =>
          normalizeSummitNameForMatch(alias) ===
          normalizeSummitNameForMatch(graphie),
      )
    ) {
      aliases.push(graphie);
      aliasesByExternalId.set(result.data.ID, aliases);
    }
  }

  return aliasesByExternalId;
}

export async function readIgnSummitSnapshot(input: {
  snapshotDirectory: string;
  sourceVersion: string;
  departmentCode?: string;
}): Promise<IgnSnapshotReadResult> {
  const departmentCode = input.departmentCode ?? '74';
  const paths = getSnapshotPaths(input.snapshotDirectory);
  await Promise.all([
    assertShapefile(paths.detailBase),
    assertShapefile(paths.toponymBase),
    assertShapefile(paths.departmentBase),
  ]);

  const [details, departments, aliasesByExternalId] = await Promise.all([
    readFeatures(paths.detailBase),
    readFeatures(paths.departmentBase),
    readToponyms(paths.toponymBase),
  ]);
  const department = departments.find((feature) => {
    const parsed = ignDepartmentPropertiesSchema.safeParse(feature.properties);
    return parsed.success && parsed.data.INSEE_DEP === departmentCode;
  });

  if (!department || !isDepartmentFeature(department)) {
    throw new Error(
      `Polygone officiel du département ${departmentCode} introuvable`,
    );
  }

  const candidates: NormalizedIgnSummit[] = [];
  const rejected: ImportRejectedFeature[] = [];

  for (const feature of details) {
    const parsed = ignDetailPropertiesSchema.safeParse(feature.properties);

    if (!parsed.success || !isPointFeature(feature)) {
      rejected.push({
        externalId: parsed.success ? parsed.data.ID : null,
        name: parsed.success ? (parsed.data.TOPONYME ?? null) : null,
        reason: 'INVALID_SOURCE',
        detail: 'Attributs ou géométrie IGN invalides',
      });
      continue;
    }

    const properties = parsed.data;
    if (!isIgnSummitNature(properties.NATURE)) {
      rejected.push({
        externalId: properties.ID,
        name: properties.TOPONYME ?? null,
        reason: 'NOT_A_SUMMIT',
        detail: `Nature IGN exclue : ${properties.NATURE}`,
      });
      continue;
    }

    const name = properties.TOPONYME
      ? normalizeSummitName(properties.TOPONYME)
      : '';
    if (!name) {
      rejected.push({
        externalId: properties.ID,
        name: null,
        reason: 'MISSING_NAME',
        detail: 'Toponyme IGN absent',
      });
      continue;
    }

    const coordinates = feature.geometry.coordinates;
    const inside = pointInDepartment(coordinates, department.geometry);
    const boundaryDistanceMeters = distanceToDepartmentBoundary(
      coordinates,
      department.geometry,
    );
    const sourcePrecisionMeters = numericPrecision(properties.PREC_PLANI);

    if (!inside && boundaryDistanceMeters > sourcePrecisionMeters) {
      rejected.push({
        externalId: properties.ID,
        name,
        reason: 'OUTSIDE_SCOPE',
        detail: `Point situé à ${Math.round(boundaryDistanceMeters)} m hors du département`,
      });
      continue;
    }

    const [longitude, latitude] = proj4('EPSG:2154', 'EPSG:4326', coordinates);
    const aliases = (aliasesByExternalId.get(properties.ID) ?? []).filter(
      (alias) =>
        normalizeSummitNameForMatch(alias) !==
        normalizeSummitNameForMatch(name),
    );

    candidates.push(
      normalizedIgnSummitSchema.parse({
        externalId: properties.ID,
        name,
        normalizedName: normalizeSummitNameForMatch(name),
        aliases,
        latitude,
        longitude,
        elevation: null,
        sourceNature: properties.NATURE,
        sourceVersion: input.sourceVersion,
        // A border is a geographic signal, never an automatic catalogue
        // demotion. Points whose side cannot be asserted beyond the source
        // precision remain visible to curation through this flag.
        boundaryReview:
          !inside || boundaryDistanceMeters <= sourcePrecisionMeters,
        boundaryDistanceMeters,
        sourceProperties: jsonSourceProperties(properties),
      }),
    );
  }

  return { sourceCount: details.length, candidates, rejected };
}
