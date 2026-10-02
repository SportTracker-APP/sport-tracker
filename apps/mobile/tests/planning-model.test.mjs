import assert from 'node:assert/strict';
import test from 'node:test';

import { createActivityDraft, validateActivityDraft } from '../src/features/activities/activity-form-model.ts';
import {
  addDays,
  createPlanningWeek,
  formatDuration,
  formatWeekPeriod,
  getNextPlannedActivity,
  getWeekSummary,
  localDateKey,
  startOfWeek,
} from '../src/features/planning/planning-model.ts';

process.env.TZ = 'Europe/Paris';

function activity({
  id,
  startedAt,
  status = 'COMPLETED',
  title = id,
  distance = null,
  duration = 0,
  plannedWorkoutId = null,
}) {
  return {
    id,
    sport: 'TRAIL',
    startedAt,
    status,
    title,
    distance,
    duration,
    plannedWorkoutId,
  };
}

test('weeks start on Monday across month and year boundaries', () => {
  const week = startOfWeek(new Date(2027, 0, 1, 12));
  assert.equal(localDateKey(week), '2026-12-28');
  assert.equal(localDateKey(addDays(week, 6)), '2027-01-03');
  assert.equal(formatWeekPeriod(week), '28 décembre 2026 — 3 janvier 2027');
  assert.equal(localDateKey(startOfWeek(new Date(2026, 8, 20, 12))), '2026-09-14');
});

test('a week exposes seven ordered days and every activity of the same day', () => {
  const monday = new Date(2026, 8, 14);
  const items = [
    activity({ id: 'early', startedAt: '2026-09-15T06:00:00+02:00' }),
    activity({ id: 'late', startedAt: '2026-09-15T18:30:00+02:00', status: 'PLANNED' }),
    activity({
      id: 'linked-completion',
      startedAt: '2026-09-15T19:00:00+02:00',
      plannedWorkoutId: 'late',
    }),
  ];
  const days = createPlanningWeek(monday, items);
  assert.equal(days.length, 7);
  assert.deepEqual(days[1].activities.map(({ id }) => id), ['early', 'late']);
  assert.equal(days[0].activities.length, 0);
  assert.equal(days[6].key, '2026-09-20');
});

test('summary preserves completed metrics, planned count, seven active days and long durations', () => {
  const monday = new Date(2026, 8, 14);
  const items = Array.from({ length: 7 }, (_, index) =>
    activity({
      id: `day-${index}`,
      startedAt: `${localDateKey(addDays(monday, index))}T08:00:00+02:00`,
      status: index === 6 ? 'PLANNED' : 'COMPLETED',
      distance: index < 6 ? 5 : null,
      duration: index === 0 ? 1500 : index < 6 ? 60 : 0,
    }),
  );
  const summary = getWeekSummary(createPlanningWeek(monday, items));
  assert.deepEqual(summary, {
    activeDays: 7,
    completedDistance: 30,
    completedDuration: 1800,
    plannedCount: 1,
  });
  assert.equal(formatDuration(summary.completedDuration), '30 h');
});

test('next session ignores past, completed and linked activities', () => {
  const now = new Date('2026-09-16T10:00:00+02:00');
  const next = getNextPlannedActivity(
    [
      activity({ id: 'past', startedAt: '2026-09-16T09:00:00+02:00', status: 'PLANNED' }),
      activity({ id: 'done', startedAt: '2026-09-16T10:30:00+02:00' }),
      activity({
        id: 'linked',
        startedAt: '2026-09-16T10:45:00+02:00',
        status: 'PLANNED',
        plannedWorkoutId: 'source',
      }),
      activity({ id: 'later', startedAt: '2026-09-16T18:00:00+02:00', status: 'PLANNED' }),
      activity({ id: 'first', startedAt: '2026-09-16T12:00:00+02:00', status: 'PLANNED' }),
    ],
    now,
  );
  assert.equal(next?.id, 'first');
});

test('day actions preserve every exact date from Monday through Sunday', () => {
  const monday = new Date(2026, 11, 28, 12);
  const dates = createPlanningWeek(monday, []).map(({ date }) =>
    createActivityDraft(new Date('2026-09-16T10:00:00+02:00'), localDateKey(date)),
  );
  assert.deepEqual(
    dates.map(({ date }) => date),
    [
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ],
  );
  assert.ok(dates.every(({ time }) => time === '12:00'));
});

test('planned creation accepts past or future dates and uses the existing API status', () => {
  const now = new Date('2026-09-16T10:00:00+02:00');
  for (const date of ['2026-09-01', '2026-12-31']) {
    const result = validateActivityDraft(
      {
        ...createActivityDraft(now, date),
        sport: 'HIKING',
        title: 'Sortie planifiée avec un nom suffisamment long',
        notes: 'Rester souple.',
      },
      now,
      'PLANNED',
    );
    assert.equal(result.ok, true);
    assert.equal(result.payload.status, 'PLANNED');
    assert.equal(result.payload.duration, 0);
    assert.equal('distance' in result.payload, false);
  }
});
