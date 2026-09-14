import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_FILTERS,
  filterSummits,
  validCoordinates,
} from '../src/features/explore/explore-model.ts';
import {
  createRefugeViewModel,
  isRecordedCompletedActivity,
} from '../src/features/refuge/refuge-model.ts';

const summits = [
  {
    id: '1',
    name: 'Pointe Percée',
    aliases: ['La Pointe'],
    primaryMassif: { name: 'Aravis' },
    altitude: 2750,
    discovered: true,
  },
  {
    id: '2',
    name: 'Mont Veyrier',
    massif: 'Bornes',
    altitude: 1291,
    discovered: false,
  },
  {
    id: '3',
    name: 'Altitude inconnue',
    massif: 'Bornes',
    altitude: null,
    discovered: false,
  },
  {
    id: '4',
    name: 'Limite exacte',
    massif: 'Bornes',
    altitude: 2000,
    discovered: false,
  },
];

test('search combines accent-insensitive words, aliases and primary massif', () => {
  assert.deepEqual(
    filterSummits(summits, 'aravis percee', DEFAULT_FILTERS).map(
      ({ id }) => id,
    ),
    ['1'],
  );
  assert.deepEqual(
    filterSummits(summits, 'la pointe', DEFAULT_FILTERS).map(({ id }) => id),
    ['1'],
  );
});

test('altitude filters exclude unknown altitudes and put exactly 2000m in the upper range', () => {
  assert.deepEqual(
    filterSummits(summits, '', {
      ...DEFAULT_FILTERS,
      altitude: 'under2000',
    }).map(({ id }) => id),
    ['2'],
  );
  assert.deepEqual(
    filterSummits(summits, '', {
      ...DEFAULT_FILTERS,
      altitude: 'over2000',
      status: 'undiscovered',
    }).map(({ id }) => id),
    ['4'],
  );
});

test('combined filters and sorting preserve the source catalog', () => {
  const original = structuredClone(summits);
  assert.deepEqual(
    filterSummits(summits, '', {
      ...DEFAULT_FILTERS,
      massif: 'Bornes',
      sort: 'altitude',
    }).map(({ id }) => id),
    ['4', '2', '3'],
  );
  assert.deepEqual(summits, original);
});

test('map links accept zero coordinates but reject missing and out-of-range positions', () => {
  assert.deepEqual(validCoordinates({ coordinates: [0, 0] }), [0, 0]);
  for (const coordinates of [null, [1], [181, 45], [6, -91], [NaN, 45]]) {
    assert.equal(validCoordinates({ coordinates }), null);
  }
});

const activity = {
  id: 'activity-1',
  title: 'Sortie',
  sport: 'HIKING',
  status: 'COMPLETED',
  startedAt: '2026-01-02T12:00:00Z',
  distance: 8,
};

test('journal and Refuge continue to exclude plans, future activities and linked duplicates', () => {
  assert.equal(isRecordedCompletedActivity(activity), true);
  for (const changes of [
    { status: 'PLANNED' },
    { startedAt: '2099-01-01T12:00:00Z' },
    { completedActivityId: 'recorded-id' },
    { distance: null },
    { startedAt: 'invalid-date' },
  ]) {
    assert.equal(
      isRecordedCompletedActivity({ ...activity, ...changes }),
      false,
    );
  }
});

test('Refuge carries the actual content ID into the selected highlight', () => {
  const input = { activities: [activity], summits: [], goals: [], badges: [] };
  assert.equal(createRefugeViewModel(input).highlight.id, activity.id);
  const model = createRefugeViewModel({
    ...input,
    summits: [{ ...summits[0], latestDiscoveredAt: '2026-01-03T12:00:00Z' }],
  });
  assert.equal(model.highlight.kind, 'summit');
  assert.equal(model.highlight.id, '1');
});
