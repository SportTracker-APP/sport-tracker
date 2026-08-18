import {
  ignDetailPropertiesSchema,
  normalizedIgnSummitSchema,
} from './summit-import.types';
import {
  isIgnSummitNature,
  isPointFeature,
  normalizeSummitName,
  normalizeSummitNameForMatch,
} from './summit-import-source';

describe('IGN summit source contracts', () => {
  it('accepts a valid BD TOPO detail record without dropping source fields', () => {
    const result = ignDetailPropertiesSchema.parse({
      ID: 'PAIOROGR0000000000000001',
      NATURE: 'Sommet',
      TOPONYME: 'Aiguille du Midi',
      PREC_PLANI: 5,
      EXTRA_SOURCE_FIELD: 'preserved',
    });

    expect(result.EXTRA_SOURCE_FIELD).toBe('preserved');
  });

  it('rejects malformed source identifiers and invalid coordinates', () => {
    expect(
      ignDetailPropertiesSchema.safeParse({ ID: '', NATURE: 'Sommet' }).success,
    ).toBe(false);
    expect(
      normalizedIgnSummitSchema.safeParse({
        externalId: 'ign-1',
        name: 'Sommet test',
        normalizedName: 'sommet test',
        aliases: [],
        latitude: 120,
        longitude: 6,
        elevation: 1_500,
        sourceNature: 'Sommet',
        sourceVersion: '2026-06-15',
        boundaryReview: false,
        boundaryDistanceMeters: 100,
        sourceProperties: {},
      }).success,
    ).toBe(false);
  });

  it('rejects non-point source geometry before normalization', () => {
    expect(
      isPointFeature({
        type: 'Feature',
        properties: { ID: 'ign-line' },
        geometry: {
          type: 'LineString',
          coordinates: [
            [900_000, 6_500_000],
            [900_010, 6_500_010],
          ],
        },
      }),
    ).toBe(false);
  });

  it('keeps accents in display names while normalizing whitespace', () => {
    expect(normalizeSummitName('  Crêt   de\u0301  Châtillon  ')).toBe(
      'Crêt dé Châtillon',
    );
  });

  it('normalizes accents and punctuation only for matching', () => {
    expect(normalizeSummitNameForMatch("  L’Aiguille   d'Été ")).toBe(
      'l aiguille d ete',
    );
  });

  it('keeps the production nature whitelist strict', () => {
    expect(isIgnSummitNature('Sommet')).toBe(true);
    expect(isIgnSummitNature('Pic')).toBe(true);
    expect(isIgnSummitNature('Col')).toBe(false);
    expect(isIgnSummitNature('Montagne')).toBe(false);
    expect(
      normalizedIgnSummitSchema.safeParse({
        externalId: 'ign-1',
        name: 'Col du test',
        normalizedName: 'col du test',
        aliases: [],
        latitude: 45,
        longitude: 6,
        elevation: 1_500,
        sourceNature: 'Col',
        sourceVersion: '2026-06-15',
        boundaryReview: false,
        boundaryDistanceMeters: 100,
        sourceProperties: {},
      }).success,
    ).toBe(false);
  });
});
