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

export type Coordinates = [longitude: number, latitude: number];

export type SummitFeatureProperties = {
  discovered: boolean;
  id: string;
  label: string;
  name: string;
  selected: boolean;
};

export type SummitFeatureCollection = {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    id: string;
    properties: SummitFeatureProperties;
    geometry: {
      type: 'Point';
      coordinates: [number, number];
    };
  }[];
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

export function validCoordinates(summit: Summit): Coordinates | null {
  const point = summit.coordinates;
  return point?.length === 2 &&
    Number.isFinite(point[0]) &&
    Number.isFinite(point[1]) &&
    Math.abs(point[0]) <= 180 &&
    Math.abs(point[1]) <= 90
    ? [point[0], point[1]]
    : null;
}

export function summitsToGeoJson(
  summits: Summit[],
  selectedId?: string,
): SummitFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: summits.flatMap((summit) => {
      const coordinates = validCoordinates(summit);
      if (!coordinates) return [];
      return [
        {
          type: 'Feature' as const,
          id: summit.id,
          properties: {
            discovered: summit.discovered,
            id: summit.id,
            label:
              summit.altitude != null && Number.isFinite(summit.altitude)
                ? `${summit.name}\n${summitAltitude(summit)}`
                : summit.name,
            name: summit.name,
            selected: summit.id === selectedId,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [coordinates[0], coordinates[1]] as [number, number],
          },
        },
      ];
    }),
  };
}

export function getMassifProgress(summits: Summit[], summit: Summit) {
  const massif = summitMassif(summit);
  if (!massif) return null;
  const members = summits.filter((item) => summitMassif(item) === massif);
  if (!members.length) return null;
  const discovered = members.filter((item) => item.discovered).length;
  return {
    massif,
    total: members.length,
    discovered,
    percent: Math.round((discovered / members.length) * 100),
  };
}

export function distanceInKilometers(
  first: Coordinates,
  second: Coordinates,
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const [firstLongitude, firstLatitude] = first;
  const [secondLongitude, secondLatitude] = second;
  const latitudeDelta = toRadians(secondLatitude - firstLatitude);
  const longitudeDelta = toRadians(secondLongitude - firstLongitude);
  const firstLatitudeRadians = toRadians(firstLatitude);
  const secondLatitudeRadians = toRadians(secondLatitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitudeRadians) *
      Math.cos(secondLatitudeRadians) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function countNearbySummits(
  summits: Summit[],
  location: Coordinates,
  radiusKilometers = 30,
) {
  return summits.filter((summit) => {
    const coordinates = validCoordinates(summit);
    return (
      coordinates !== null &&
      distanceInKilometers(location, coordinates) <= radiusKilometers
    );
  }).length;
}
