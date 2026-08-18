import { SummitCatalogTier } from '@prisma/client';

export type SummitCatalogTierSignals = {
  legacyCertain: boolean;
  ignImportance: number | null;
  osmMatched: boolean;
  osmMatchMethod: 'NAME' | 'POSITION' | null;
  osmDistanceMeters: number | null;
  osmProminenceMeters: number | null;
  osmProminenceSource: string | null;
  nearestHigherDistanceMeters: number | null;
};

export type SummitCatalogTierDecision = {
  tier: SummitCatalogTier;
  reason: string;
};

const LOW_PROMINENCE_METERS = 30;
const CORE_ISOLATION_METERS = 1_000;
const SECONDARY_ISOLATION_METERS = 500;

export function classifySummitCatalogTier(
  signals: SummitCatalogTierSignals,
): SummitCatalogTierDecision {
  if (signals.legacyCertain) {
    return { tier: SummitCatalogTier.CORE, reason: 'Legacy HOVREN' };
  }

  const lowDeclaredProminence =
    signals.osmProminenceMeters !== null &&
    signals.osmProminenceMeters < LOW_PROMINENCE_METERS;

  if (lowDeclaredProminence) {
    return {
      tier: SummitCatalogTier.SECONDARY,
      reason: `Proéminence OSM déclarée ${signals.osmProminenceMeters} m (< ${LOW_PROMINENCE_METERS} m)`,
    };
  }

  if (
    signals.ignImportance !== null &&
    signals.ignImportance >= 1 &&
    signals.ignImportance <= 2
  ) {
    return {
      tier: SummitCatalogTier.CORE,
      reason: `IGN importance ${signals.ignImportance}`,
    };
  }

  if (
    signals.ignImportance === 3 &&
    signals.osmMatched &&
    signals.nearestHigherDistanceMeters !== null &&
    signals.nearestHigherDistanceMeters > CORE_ISOLATION_METERS
  ) {
    return {
      tier: SummitCatalogTier.CORE,
      reason: 'IGN importance 3 + OSM + sommet supérieur à plus de 1 km',
    };
  }

  if (signals.ignImportance === 3) {
    return {
      tier: SummitCatalogTier.SECONDARY,
      reason: 'IGN importance 3 sans les trois signaux CORE',
    };
  }

  if (
    signals.ignImportance === 4 &&
    signals.osmMatched &&
    signals.nearestHigherDistanceMeters !== null &&
    signals.nearestHigherDistanceMeters > SECONDARY_ISOLATION_METERS
  ) {
    return {
      tier: SummitCatalogTier.SECONDARY,
      reason: 'IGN importance 4 + OSM + sommet supérieur à plus de 500 m',
    };
  }

  return {
    tier: SummitCatalogTier.REFERENCE,
    reason: 'Candidat dense ou de faible importance cartographique',
  };
}
