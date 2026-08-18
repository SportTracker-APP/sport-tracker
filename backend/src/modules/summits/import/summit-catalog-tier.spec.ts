import { SummitCatalogTier } from '@prisma/client';

import {
  classifySummitCatalogTier,
  type SummitCatalogTierSignals,
} from './summit-catalog-tier';

function signals(
  overrides: Partial<SummitCatalogTierSignals> = {},
): SummitCatalogTierSignals {
  return {
    legacyCertain: false,
    ignImportance: 5,
    osmMatched: false,
    osmMatchMethod: null,
    osmDistanceMeters: null,
    osmProminenceMeters: null,
    osmProminenceSource: null,
    nearestHigherDistanceMeters: 100,
    ...overrides,
  };
}

describe('Scenario B summit catalog tier', () => {
  it.each([
    ['Mont Blanc', signals({ legacyCertain: true }), SummitCatalogTier.CORE],
    [
      'Mont Blanc de Courmayeur',
      signals({ ignImportance: 2, osmProminenceMeters: 17 }),
      SummitCatalogTier.SECONDARY,
    ],
    ['Dent du Crocodile', signals(), SummitCatalogTier.REFERENCE],
    ['Pointe Percée', signals({ legacyCertain: true }), SummitCatalogTier.CORE],
    ['Mont Veyrier', signals({ legacyCertain: true }), SummitCatalogTier.CORE],
  ])('classifies %s', (_name, input, expected) => {
    expect(classifySummitCatalogTier(input).tier).toBe(expected);
  });

  it('keeps every certain legacy CORE even with low prominence', () => {
    expect(
      classifySummitCatalogTier(
        signals({ legacyCertain: true, osmProminenceMeters: 5 }),
      ).tier,
    ).toBe(SummitCatalogTier.CORE);
  });

  it('requires OSM and more than 1 km of higher-summit isolation for an IGN 3 CORE', () => {
    expect(
      classifySummitCatalogTier(
        signals({
          ignImportance: 3,
          osmMatched: true,
          nearestHigherDistanceMeters: 1_001,
        }),
      ).tier,
    ).toBe(SummitCatalogTier.CORE);
    expect(
      classifySummitCatalogTier(
        signals({
          ignImportance: 3,
          osmMatched: true,
          nearestHigherDistanceMeters: 1_000,
        }),
      ).tier,
    ).toBe(SummitCatalogTier.SECONDARY);
  });
});
