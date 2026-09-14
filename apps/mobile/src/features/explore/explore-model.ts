import type { RefugeSummit } from '../refuge/contracts';

export type Summit = RefugeSummit & {
  aliases?: string[];
  coordinates?: readonly [number, number] | null;
  difficulty?: string | null;
  department?: string | null;
  type?: string | null;
  activityCount?: number | null;
};

export type ExploreFilters = {
  status: 'all' | 'undiscovered' | 'discovered';
  massif: string | null;
  altitude: 'all' | 'under2000' | 'over2000';
  sort: 'name' | 'altitude';
};

export const DEFAULT_FILTERS: ExploreFilters = {
  status: 'all',
  massif: null,
  altitude: 'all',
  sort: 'name',
};

export function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function summitMassif(summit: Summit) {
  return (
    summit.primaryMassif?.name?.trim() ||
    summit.geoAreas?.find((area) => area.type === 'MASSIF')?.name?.trim() ||
    summit.massif?.trim() ||
    ''
  );
}

export function filterSummits(
  summits: Summit[],
  query: string,
  filters: ExploreFilters,
) {
  const terms = normalizeSearch(query).split(' ').filter(Boolean);
  return summits
    .filter((summit) => {
      if (filters.status === 'discovered' && !summit.discovered) return false;
      if (filters.status === 'undiscovered' && summit.discovered) return false;
      if (filters.massif && summitMassif(summit) !== filters.massif)
        return false;
      if (filters.altitude !== 'all') {
        if (summit.altitude == null || !Number.isFinite(summit.altitude))
          return false;
        if (filters.altitude === 'under2000' && summit.altitude >= 2000)
          return false;
        if (filters.altitude === 'over2000' && summit.altitude < 2000)
          return false;
      }
      const search = normalizeSearch(
        [
          summit.name,
          ...(summit.aliases ?? []),
          summitMassif(summit),
          summit.department,
        ]
          .filter(Boolean)
          .join(' '),
      );
      return terms.every((term) => search.includes(term));
    })
    .sort((a, b) => {
      if (filters.sort === 'altitude') {
        const difference =
          (Number.isFinite(b.altitude) ? b.altitude! : -Infinity) -
          (Number.isFinite(a.altitude) ? a.altitude! : -Infinity);
        if (difference && !Number.isNaN(difference)) return difference;
      }
      return a.name.localeCompare(b.name, 'fr');
    });
}

export function summitAltitude(summit: Summit) {
  return summit.altitude != null && Number.isFinite(summit.altitude)
    ? `${new Intl.NumberFormat('fr-FR').format(summit.altitude)} m`
    : 'Altitude non renseignée';
}

export function validCoordinates(summit: Summit) {
  const point = summit.coordinates;
  return point?.length === 2 &&
    Number.isFinite(point[0]) &&
    Number.isFinite(point[1]) &&
    Math.abs(point[0]) <= 180 &&
    Math.abs(point[1]) <= 90
    ? point
    : null;
}
