import {
  isKnownMassifCandidate,
  matchWikidataMassifIdentity,
} from './summit-massif-curation';

function entity(overrides: Record<string, unknown> = {}) {
  return {
    lastrevid: 123456,
    labels: {
      fr: { language: 'fr', value: "Aiguille d'Argentière" },
    },
    aliases: { fr: [] },
    claims: {
      P625: [
        {
          mainsnak: {
            datavalue: {
              value: { latitude: 45.9596, longitude: 7.0201 },
            },
          },
        },
      ],
      P2044: [
        {
          mainsnak: { datavalue: { value: { amount: '+3901' } } },
        },
      ],
      P4552: [
        {
          mainsnak: {
            datavalue: { value: { id: 'Q671343' } },
          },
        },
      ],
    },
    ...overrides,
  };
}

const target = {
  id: 'aiguille-argentiere',
  name: "Aiguille d'Argentière",
  aliases: [],
  altitude: 3901,
  latitude: 45.9596,
  longitude: 7.0201,
  wikidataId: 'Q123',
};

describe('summit massif curation', () => {
  it('requires the same identity, nearby coordinates and compatible altitude', () => {
    expect(matchWikidataMassifIdentity(target, 'Q123', entity())).toEqual({
      wikidataId: 'Q123',
      revision: '123456',
      distanceMeters: 0,
      altitudeDeltaMeters: 0,
      rangeIds: ['Q671343'],
    });

    expect(
      matchWikidataMassifIdentity(target, 'Q123', {
        ...entity(),
        labels: { fr: { language: 'fr', value: 'Autre sommet' } },
      }),
    ).toBeNull();
    expect(
      matchWikidataMassifIdentity(target, 'Q123', {
        ...entity(),
        claims: {
          ...entity().claims,
          P625: [
            {
              mainsnak: {
                datavalue: {
                  value: { latitude: 45.8, longitude: 6.8 },
                },
              },
            },
          ],
        },
      }),
    ).toBeNull();
    expect(
      matchWikidataMassifIdentity(target, 'Q123', {
        ...entity(),
        claims: {
          ...entity().claims,
          P2044: [{ mainsnak: { datavalue: { value: { amount: '+3500' } } } }],
        },
      }),
    ).toBeNull();
  });

  it('accepts only an immutable, known range-to-massif mapping', () => {
    expect(
      isKnownMassifCandidate({
        summitId: target.id,
        summitName: target.name,
        wikidataId: 'Q123',
        wikidataRevision: '123456',
        sourceMethod: 'OSM_WIKIDATA_REFERENCE',
        sourceRangeId: 'Q671343',
        sourceRangeLabel: 'massif du Mont-Blanc',
        massifSlug: 'massif-du-mont-blanc',
        massifName: 'Mont-Blanc',
        distanceMeters: 0,
        altitudeDeltaMeters: 0,
      }),
    ).toBe(true);
    expect(
      isKnownMassifCandidate({
        summitId: target.id,
        summitName: target.name,
        wikidataId: 'Q123',
        wikidataRevision: '123456',
        sourceMethod: 'OSM_WIKIDATA_REFERENCE',
        sourceRangeId: 'Q671343',
        sourceRangeLabel: 'massif du Mont-Blanc',
        massifSlug: 'chablais',
        massifName: 'Chablais',
        distanceMeters: 0,
        altitudeDeltaMeters: 0,
      }),
    ).toBe(false);
  });
});
