import assert from 'node:assert/strict';
import test from 'node:test';

import {
  countNearbySummits,
  distanceInKilometers,
  getMassifProgress,
  summitsToGeoJson,
} from '../src/features/explore/explore-model.ts';

const summits = [
  {
    id: 'tournette',
    name: 'La Tournette',
    altitude: 2351,
    massif: 'Massif des Bornes',
    coordinates: [6.286, 45.827],
    discovered: true,
  },
  {
    id: 'jalouvre',
    name: 'Pic de Jallouvre',
    altitude: 2408,
    massif: 'Massif des Bornes',
    coordinates: [6.442, 45.997],
    discovered: false,
  },
  {
    id: 'invalid',
    name: 'Sommet sans position',
    massif: 'Massif des Bornes',
    coordinates: null,
    discovered: false,
  },
];

test('builds a safe point collection and marks the selected summit', () => {
  const collection = summitsToGeoJson(summits, 'jalouvre');

  assert.equal(collection.features.length, 2);
  assert.equal(collection.features[1].properties.selected, true);
  assert.deepEqual(collection.features[0].geometry.coordinates, [6.286, 45.827]);
});

test('computes massif progress from the loaded catalogue', () => {
  assert.deepEqual(getMassifProgress(summits, summits[0]), {
    massif: 'Massif des Bornes',
    total: 3,
    discovered: 1,
    percent: 33,
  });
});

test('calculates real geographic proximity and ignores missing positions', () => {
  const distance = distanceInKilometers(
    [6.286, 45.827],
    [6.442, 45.997],
  );

  assert.ok(distance > 20 && distance < 25);
  assert.equal(countNearbySummits(summits, [6.286, 45.827], 25), 2);
  assert.equal(countNearbySummits(summits, [6.286, 45.827], 10), 1);
});
