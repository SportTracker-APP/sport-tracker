export const IGN_SUMMIT_NATURES = ['Sommet', 'Pic'] as const;

export const IGN_BD_TOPO_SOURCE_NAME = 'IGN BD TOPO® — Détail orographique';
export const IGN_BD_TOPO_PROVIDER = 'IGN_BD_TOPO' as const;
export const HAUTE_SAVOIE_DEPARTMENT_CODE = '74';
export const HAUTE_SAVOIE_GEO_AREA_SLUG = 'haute-savoie';

// A legacy coordinate can be approximate. Keep a wider review radius than the
// certain-match radius so a close namesake is never created automatically.
export const LEGACY_NAME_MATCH_MAX_DISTANCE_METERS = 3_000;
export const LEGACY_CERTAIN_MATCH_MAX_DISTANCE_METERS = 400;
export const LEGACY_ALTITUDE_TOLERANCE_METERS = 80;

export const IGN_ALTIMETRY_RESOURCE = 'ign_rge_alti_wld';
export const IGN_ALTIMETRY_URL =
  'https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json';
export const IGN_ALTIMETRY_MAX_POINTS_PER_REQUEST = 5_000;
