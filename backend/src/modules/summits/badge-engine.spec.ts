import { SportType, WeatherType } from '@prisma/client';

import { BADGE_CATALOG, BadgeCatalogItem, BadgeRule } from './badge-catalog';
import { evaluateBadgeCatalog } from './badge-engine';

type TestActivity = Parameters<typeof evaluateBadgeCatalog>[1][number];

function makeBadge(id: string, rule: BadgeRule): BadgeCatalogItem {
  return {
    id,
    name: id,
    description: id,
    hint: id,
    icon: 'Mountain',
    tone: 'summit',
    sortOrder: 1,
    category: 'Progression D+',
    criterion: id,
    rule,
  };
}

function makeActivity(overrides: Partial<TestActivity> = {}): TestActivity {
  return {
    distance: 0,
    elevationGain: 0,
    sport: SportType.TRAIL,
    startLatitude: 45.899,
    startLongitude: 6.129,
    startedAt: new Date('2026-06-15T08:00:00.000Z'),
    temperature: null,
    weather: null,
    ...overrides,
  };
}

describe('badge engine', () => {
  it('exposes the 33 approved badges without exploration concepts', () => {
    expect(BADGE_CATALOG).toHaveLength(33);
    expect(
      BADGE_CATALOG.some((badge) => String(badge.category) === 'Exploration'),
    ).toBe(false);
    expect(
      BADGE_CATALOG.find((badge) => badge.id === 'progress-elevation-10000')
        ?.rule,
    ).toEqual({ kind: 'TOTAL_ELEVATION', thresholdMeters: 10_000 });
    expect(
      BADGE_CATALOG.find((badge) => badge.id === 'progress-elevation-100000')
        ?.rule,
    ).toEqual({ kind: 'TOTAL_ELEVATION', thresholdMeters: 100_000 });
  });

  it('evaluates lifetime distance and elevation thresholds', () => {
    const badges = [
      makeBadge('distance', { kind: 'TOTAL_DISTANCE', thresholdKm: 100 }),
      makeBadge('elevation', {
        kind: 'TOTAL_ELEVATION',
        thresholdMeters: 10_000,
      }),
    ];
    const activities = [
      makeActivity({ distance: 60, elevationGain: 4_000 }),
      makeActivity({ distance: 45, elevationGain: 6_000 }),
    ];

    expect(evaluateBadgeCatalog(badges, activities, [])).toEqual(
      new Set(['distance', 'elevation']),
    );
  });

  it('requires a single activity for an exploit badge', () => {
    const badge = makeBadge('single', {
      kind: 'SINGLE_ACTIVITY_ELEVATION',
      thresholdMeters: 2_000,
    });

    expect(
      evaluateBadgeCatalog(
        [badge],
        [
          makeActivity({ elevationGain: 1_500 }),
          makeActivity({ elevationGain: 1_500 }),
        ],
        [],
      ),
    ).toEqual(new Set());
    expect(
      evaluateBadgeCatalog(
        [badge],
        [makeActivity({ elevationGain: 2_000 })],
        [],
      ),
    ).toEqual(new Set(['single']));
  });

  it('counts distinct confirmed summits', () => {
    const badge = makeBadge('summits', {
      kind: 'DISTINCT_SUMMITS',
      threshold: 2,
    });
    const date = new Date('2026-05-10T08:00:00.000Z');

    expect(
      evaluateBadgeCatalog(
        [badge],
        [],
        [
          { summitId: 'a', activity: { startedAt: date } },
          { summitId: 'a', activity: { startedAt: date } },
          { summitId: 'b', activity: { startedAt: date } },
        ],
      ),
    ).toEqual(new Set(['summits']));
  });

  it('does not combine the same calendar month across different years', () => {
    const badge = makeBadge('august', {
      kind: 'MONTHLY_DISTANCE',
      month: 8,
      thresholdKm: 100,
    });
    const splitYears = [
      makeActivity({
        distance: 60,
        startedAt: new Date('2025-08-10T08:00:00.000Z'),
      }),
      makeActivity({
        distance: 60,
        startedAt: new Date('2026-08-10T08:00:00.000Z'),
      }),
    ];

    expect(evaluateBadgeCatalog([badge], splitYears, [])).toEqual(new Set());
    expect(
      evaluateBadgeCatalog(
        [badge],
        [
          ...splitYears,
          makeActivity({
            distance: 40,
            startedAt: new Date('2026-08-20T08:00:00.000Z'),
          }),
        ],
        [],
      ),
    ).toEqual(new Set(['august']));
  });

  it('uses weather, temperature and actual sunrise data', () => {
    const badges = [
      makeBadge('rain', { kind: 'RAINY_ACTIVITY' }),
      makeBadge('winter', {
        kind: 'TEMPERATURE_BELOW',
        thresholdCelsius: 0,
      }),
      makeBadge('sunrise', { kind: 'BEFORE_SUNRISE' }),
    ];
    const activity = makeActivity({
      startedAt: new Date('2026-06-15T03:00:00.000Z'),
      temperature: -2,
      weather: WeatherType.RAINY,
    });

    expect(evaluateBadgeCatalog(badges, [activity], [])).toEqual(
      new Set(['rain', 'winter', 'sunrise']),
    );
  });
});
