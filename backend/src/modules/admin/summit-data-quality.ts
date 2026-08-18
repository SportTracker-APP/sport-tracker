export type SummitDataQualityInput = {
  id: string;
  name: string;
  altitude: number;
  latitude: number;
  longitude: number;
  primaryMassifId: string | null;
  geoAreaCount: number;
};

export type SummitDataQualityIssueCode =
  | 'MISSING_NAME'
  | 'MISSING_SLUG'
  | 'MISSING_ALTITUDE'
  | 'MISSING_COORDINATES'
  | 'MISSING_GEO_AREA'
  | 'MISSING_PRIMARY_MASSIF';

export function getSummitDataQuality(input: SummitDataQualityInput) {
  const missing: Array<{
    code: SummitDataQualityIssueCode;
    label: string;
  }> = [];

  if (!input.name.trim()) {
    missing.push({ code: 'MISSING_NAME', label: 'Nom' });
  }

  if (!input.id.trim()) {
    missing.push({ code: 'MISSING_SLUG', label: 'Identifiant / slug' });
  }

  if (!Number.isFinite(input.altitude) || input.altitude <= 0) {
    missing.push({ code: 'MISSING_ALTITUDE', label: 'Altitude' });
  }

  if (
    !Number.isFinite(input.latitude) ||
    !Number.isFinite(input.longitude) ||
    input.latitude < -90 ||
    input.latitude > 90 ||
    input.longitude < -180 ||
    input.longitude > 180
  ) {
    missing.push({ code: 'MISSING_COORDINATES', label: 'Coordonnées' });
  }

  if (input.geoAreaCount === 0) {
    missing.push({ code: 'MISSING_GEO_AREA', label: 'Territoire associé' });
  }

  if (!input.primaryMassifId) {
    missing.push({
      code: 'MISSING_PRIMARY_MASSIF',
      label: 'Massif principal',
    });
  }

  return {
    isComplete: missing.length === 0,
    missingCount: missing.length,
    missing,
  };
}

export function getSummitPublicationQuality(input: SummitDataQualityInput) {
  const quality = getSummitDataQuality(input);
  const blocking = quality.missing.filter(
    ({ code }) => code !== 'MISSING_PRIMARY_MASSIF',
  );

  return {
    ...quality,
    isPublishable: blocking.length === 0,
    blocking,
  };
}
