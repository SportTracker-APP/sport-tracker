import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calendarDays,
  createActivityDraft,
  formatActivityDuration,
  localDateKey,
  parseLocalStart,
  validateActivityDraft,
} from '../src/features/activities/activity-form-model.ts';
import { createGoalProgress } from '../src/features/refuge/refuge-model.ts';
import {
  notifyActivityChanged,
  subscribeToActivityChanges,
} from '../src/features/activities/activity-events.ts';

process.env.TZ = 'Europe/Paris';
const now = new Date('2026-09-14T14:00:00Z');
const valid = {
  ...createActivityDraft(now),
  hours: '1',
  minutes: '30',
  date: '2026-09-13',
  time: '09:30',
};

test('manual creation sends minutes, kilometers and a local departure converted to UTC', () => {
  const result = validateActivityDraft(
    {
      ...valid,
      distance: '8,5',
      elevationGain: '450',
      title: '  Au lac  ',
      notes: '  Belle lumière.  ',
    },
    now,
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.payload, {
    type: 'TRAINING',
    status: 'COMPLETED',
    sport: 'HIKING',
    startedAt: '2026-09-13T07:30:00.000Z',
    duration: 90,
    distance: 8.5,
    elevationGain: 450,
    title: 'Au lac',
    description: 'Belle lumière.',
  });
});

test('blank optional measures are omitted instead of inventing zero measurements', () => {
  const result = validateActivityDraft(valid, now);
  assert.equal(result.ok, true);
  for (const field of [
    'title',
    'distance',
    'elevationGain',
    'description',
    'city',
  ])
    assert.equal(field in result.payload, false);
  assert.equal(
    validateActivityDraft({ ...valid, distance: '0' }, now).payload.distance,
    0,
  );
});

test('invalid numeric input, integer overflow and out-of-range minutes cannot be submitted', () => {
  for (const patch of [
    { distance: '-1' },
    { distance: '1e5' },
    { distance: '8,5,2' },
    { elevationGain: '12.5' },
    { elevationGain: '2147483648' },
    { hours: '-1' },
    { minutes: '60' },
    { hours: '', minutes: '' },
  ]) {
    assert.equal(
      validateActivityDraft({ ...valid, ...patch }, now).ok,
      false,
      JSON.stringify(patch),
    );
  }
});

test('impossible dates, future departures and nonexistent DST hours are rejected', () => {
  for (const [date, time] of [
    ['2026-02-30', '09:30'],
    ['2026-09-13', '24:00'],
    ['2026-03-29', '02:30'],
  ])
    assert.equal(parseLocalStart(date, time), null);
  assert.equal(
    validateActivityDraft({ ...valid, date: '2026-09-15' }, now).ok,
    false,
  );
  assert.equal(
    validateActivityDraft({ ...valid, date: '2026-09-14', time: '16:01' }, now)
      .ok,
    false,
  );
  assert.ok(parseLocalStart('2024-02-29', '09:30'));
});

test('calendar uses Monday-first rows, leap days and local dates', () => {
  const days = calendarDays(new Date(2024, 1, 1));
  assert.deepEqual(days.slice(0, 4), [null, null, null, '2024-02-01']);
  assert.equal(days.filter(Boolean).length, 29);
  assert.equal(days.length % 7, 0);
  assert.equal(localDateKey(new Date('2026-09-13T22:30:00Z')), '2026-09-14');
});

test('duration display and duration goals use the same minutes as the API', () => {
  assert.equal(formatActivityDuration(90), '1 h 30');
  assert.equal(formatActivityDuration(45), '45 min');
  assert.equal(formatActivityDuration(null), null);
  const result = createGoalProgress(
    [
      {
        id: 'goal',
        title: 'Deux heures',
        type: 'DURATION_MIN',
        target: 120,
        period: 'CUSTOM',
        isActive: true,
        startDate: '2020-01-01',
        endDate: '2099-12-31',
        createdAt: '2020-01-01',
      },
    ],
    [
      {
        id: 'a1',
        sport: 'HIKING',
        status: 'COMPLETED',
        startedAt: '2026-01-02T10:00:00Z',
        duration: 90,
      },
    ],
  );
  assert.equal(result.progress, 75);
  assert.equal(result.currentLabel, '1 h 30 min');
});

test('account-free invalidation notifies subscribed screens and stops after unmount', () => {
  let calls = 0;
  const unsubscribe = subscribeToActivityChanges(() => {
    calls++;
  });
  notifyActivityChanged();
  unsubscribe();
  notifyActivityChanged();
  assert.equal(calls, 1);
});
