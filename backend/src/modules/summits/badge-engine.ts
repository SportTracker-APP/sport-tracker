import { Activity, SportType, WeatherType } from '@prisma/client';
import SunCalc from 'suncalc';

import { BadgeCatalogItem, BadgeRule } from './badge-catalog';

export type BadgeActivity = Pick<
  Activity,
  | 'distance'
  | 'elevationGain'
  | 'sport'
  | 'startLatitude'
  | 'startLongitude'
  | 'startedAt'
  | 'temperature'
  | 'weather'
>;

export type BadgeSummitDiscovery = {
  summitId: string;
  activity: { startedAt: Date };
};

export type BadgeProgress = {
  current: number;
  target: number;
  unit: string;
};

type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

const PARIS_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

function getCalendarDate(date: Date): CalendarDate {
  const parts = PARIS_DATE_FORMATTER.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
  };
}

function isOutdoor(activity: BadgeActivity): boolean {
  return (
    activity.sport !== SportType.GYM && activity.sport !== SportType.FITNESS
  );
}

function isRainy(activity: BadgeActivity): boolean {
  return activity.weather === WeatherType.RAINY;
}

function getIsoWeekKey(date: Date): string {
  const calendarDate = getCalendarDate(date);
  const utcDate = new Date(
    Date.UTC(calendarDate.year, calendarDate.month - 1, calendarDate.day),
  );
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((utcDate.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );

  return `${utcDate.getUTCFullYear()}-${week}`;
}

function hasMatchingMonth<T extends { startedAt: Date }>(
  values: T[],
  month: number,
  predicate: (values: T[]) => boolean,
): boolean {
  const byYear = new Map<number, T[]>();

  for (const value of values) {
    const calendarDate = getCalendarDate(value.startedAt);

    if (calendarDate.month !== month) {
      continue;
    }

    const yearValues = byYear.get(calendarDate.year) ?? [];
    yearValues.push(value);
    byYear.set(calendarDate.year, yearValues);
  }

  return Array.from(byYear.values()).some(predicate);
}

function getMonthGroups<T extends { startedAt: Date }>(
  values: T[],
  month: number,
): T[][] {
  const byYear = new Map<number, T[]>();

  for (const value of values) {
    const calendarDate = getCalendarDate(value.startedAt);

    if (calendarDate.month !== month) {
      continue;
    }

    const yearValues = byYear.get(calendarDate.year) ?? [];
    yearValues.push(value);
    byYear.set(calendarDate.year, yearValues);
  }

  return Array.from(byYear.values());
}

function startedBeforeSunrise(activity: BadgeActivity): boolean {
  if (activity.startLatitude === null || activity.startLongitude === null) {
    return false;
  }

  const sunrise = SunCalc.getTimes(
    activity.startedAt,
    activity.startLatitude,
    activity.startLongitude,
  ).sunrise;

  return (
    sunrise !== null &&
    !Number.isNaN(sunrise.getTime()) &&
    activity.startedAt < sunrise
  );
}

export function evaluateBadgeCatalog(
  catalog: BadgeCatalogItem[],
  activities: BadgeActivity[],
  summitDiscoveries: BadgeSummitDiscovery[],
): Set<string> {
  const qualified = new Set<string>();
  const totalDistance = activities.reduce(
    (total, activity) => total + (activity.distance ?? 0),
    0,
  );
  const totalElevation = activities.reduce(
    (total, activity) => total + (activity.elevationGain ?? 0),
    0,
  );
  const distinctSummits = new Set(
    summitDiscoveries.map((discovery) => discovery.summitId),
  ).size;
  const datedSummitDiscoveries = summitDiscoveries.map((discovery) => ({
    summitId: discovery.summitId,
    startedAt: discovery.activity.startedAt,
  }));

  for (const badge of catalog) {
    const { rule } = badge;
    let isQualified = false;

    switch (rule.kind) {
      case 'TOTAL_DISTANCE':
        isQualified = totalDistance >= rule.thresholdKm;
        break;
      case 'DISTINCT_SUMMITS':
        isQualified = distinctSummits >= rule.threshold;
        break;
      case 'BEFORE_SUNRISE':
        isQualified = activities.some(startedBeforeSunrise);
        break;
      case 'TEMPERATURE_BELOW':
        isQualified = activities.some(
          (activity) =>
            activity.temperature !== null &&
            activity.temperature < rule.thresholdCelsius,
        );
        break;
      case 'RAINY_ACTIVITY':
        isQualified = activities.some(isRainy);
        break;
      case 'SINGLE_ACTIVITY_ELEVATION':
        isQualified = activities.some(
          (activity) => (activity.elevationGain ?? 0) >= rule.thresholdMeters,
        );
        break;
      case 'TOTAL_ELEVATION':
        isQualified = totalElevation >= rule.thresholdMeters;
        break;
      case 'MONTHLY_ELEVATION':
        isQualified = hasMatchingMonth(
          activities,
          rule.month,
          (values) =>
            values.reduce(
              (total, activity) => total + (activity.elevationGain ?? 0),
              0,
            ) >= rule.thresholdMeters,
        );
        break;
      case 'MONTHLY_ACTIVITY_COUNT':
        isQualified = hasMatchingMonth(
          activities,
          rule.month,
          (values) => values.length >= rule.threshold,
        );
        break;
      case 'MONTHLY_OUTDOOR_DISTANCE':
        isQualified = hasMatchingMonth(
          activities,
          rule.month,
          (values) =>
            values
              .filter(isOutdoor)
              .reduce(
                (total, activity) => total + (activity.distance ?? 0),
                0,
              ) >= rule.thresholdKm,
        );
        break;
      case 'MONTHLY_SUMMITS':
        isQualified = hasMatchingMonth(
          datedSummitDiscoveries,
          rule.month,
          (values) =>
            new Set(values.map((discovery) => discovery.summitId)).size >=
            rule.threshold,
        );
        break;
      case 'MONTHLY_DISTANCE':
        isQualified = hasMatchingMonth(
          activities,
          rule.month,
          (values) =>
            values.reduce(
              (total, activity) => total + (activity.distance ?? 0),
              0,
            ) >= rule.thresholdKm,
        );
        break;
      case 'MONTHLY_LONG_RUNS':
        isQualified = hasMatchingMonth(
          activities,
          rule.month,
          (values) =>
            values.filter(
              (activity) =>
                (activity.sport === SportType.RUNNING ||
                  activity.sport === SportType.TRAIL) &&
                (activity.distance ?? 0) > rule.minimumDistanceKm,
            ).length >= rule.threshold,
        );
        break;
      case 'MONTHLY_RAIN_AND_DISTANCE':
        isQualified = hasMatchingMonth(
          activities,
          rule.month,
          (values) =>
            values.some(isRainy) &&
            values.reduce(
              (total, activity) => total + (activity.distance ?? 0),
              0,
            ) >= rule.thresholdKm,
        );
        break;
      case 'MONTHLY_ACTIVE_WEEKS':
        isQualified = hasMatchingMonth(
          activities,
          rule.month,
          (values) =>
            new Set(
              values
                .filter(isOutdoor)
                .map((activity) => getIsoWeekKey(activity.startedAt)),
            ).size >= rule.threshold,
        );
        break;
    }

    if (isQualified) {
      qualified.add(badge.id);
    }
  }

  return qualified;
}

export function getBadgeProgress(
  rule: BadgeRule,
  activities: BadgeActivity[],
  summitDiscoveries: BadgeSummitDiscovery[],
): BadgeProgress | null {
  const totalDistance = activities.reduce(
    (total, activity) => total + (activity.distance ?? 0),
    0,
  );
  const totalElevation = activities.reduce(
    (total, activity) => total + (activity.elevationGain ?? 0),
    0,
  );
  const distinctSummits = new Set(
    summitDiscoveries.map((discovery) => discovery.summitId),
  ).size;
  const datedSummitDiscoveries = summitDiscoveries.map((discovery) => ({
    summitId: discovery.summitId,
    startedAt: discovery.activity.startedAt,
  }));

  switch (rule.kind) {
    case 'TOTAL_DISTANCE':
      return {
        current: totalDistance,
        target: rule.thresholdKm,
        unit: 'km',
      };
    case 'DISTINCT_SUMMITS':
      return {
        current: distinctSummits,
        target: rule.threshold,
        unit: 'sommets',
      };
    case 'BEFORE_SUNRISE':
      return {
        current: activities.some(startedBeforeSunrise) ? 1 : 0,
        target: 1,
        unit: 'sortie',
      };
    case 'TEMPERATURE_BELOW':
      return {
        current: activities.some(
          (activity) =>
            activity.temperature !== null &&
            activity.temperature < rule.thresholdCelsius,
        )
          ? 1
          : 0,
        target: 1,
        unit: 'sortie',
      };
    case 'RAINY_ACTIVITY':
      return {
        current: activities.some(isRainy) ? 1 : 0,
        target: 1,
        unit: 'sortie',
      };
    case 'SINGLE_ACTIVITY_ELEVATION':
      return {
        current: Math.max(
          0,
          ...activities.map((activity) => activity.elevationGain ?? 0),
        ),
        target: rule.thresholdMeters,
        unit: 'm D+',
      };
    case 'TOTAL_ELEVATION':
      return {
        current: totalElevation,
        target: rule.thresholdMeters,
        unit: 'm D+',
      };
    case 'MONTHLY_ELEVATION':
      return {
        current: Math.max(
          0,
          ...getMonthGroups(activities, rule.month).map((values) =>
            values.reduce(
              (total, activity) => total + (activity.elevationGain ?? 0),
              0,
            ),
          ),
        ),
        target: rule.thresholdMeters,
        unit: 'm D+',
      };
    case 'MONTHLY_ACTIVITY_COUNT':
      return {
        current: Math.max(
          0,
          ...getMonthGroups(activities, rule.month).map(
            (values) => values.length,
          ),
        ),
        target: rule.threshold,
        unit: 'sorties',
      };
    case 'MONTHLY_OUTDOOR_DISTANCE':
      return {
        current: Math.max(
          0,
          ...getMonthGroups(activities, rule.month).map((values) =>
            values
              .filter(isOutdoor)
              .reduce((total, activity) => total + (activity.distance ?? 0), 0),
          ),
        ),
        target: rule.thresholdKm,
        unit: 'km',
      };
    case 'MONTHLY_SUMMITS':
      return {
        current: Math.max(
          0,
          ...getMonthGroups(datedSummitDiscoveries, rule.month).map(
            (values) =>
              new Set(values.map((discovery) => discovery.summitId)).size,
          ),
        ),
        target: rule.threshold,
        unit: 'sommets',
      };
    case 'MONTHLY_DISTANCE':
      return {
        current: Math.max(
          0,
          ...getMonthGroups(activities, rule.month).map((values) =>
            values.reduce(
              (total, activity) => total + (activity.distance ?? 0),
              0,
            ),
          ),
        ),
        target: rule.thresholdKm,
        unit: 'km',
      };
    case 'MONTHLY_LONG_RUNS':
      return {
        current: Math.max(
          0,
          ...getMonthGroups(activities, rule.month).map(
            (values) =>
              values.filter(
                (activity) =>
                  (activity.sport === SportType.RUNNING ||
                    activity.sport === SportType.TRAIL) &&
                  (activity.distance ?? 0) > rule.minimumDistanceKm,
              ).length,
          ),
        ),
        target: rule.threshold,
        unit: 'sorties',
      };
    case 'MONTHLY_RAIN_AND_DISTANCE':
      return {
        current: Math.max(
          0,
          ...getMonthGroups(activities, rule.month).map((values) =>
            values.some(isRainy)
              ? values.reduce(
                  (total, activity) => total + (activity.distance ?? 0),
                  0,
                )
              : 0,
          ),
        ),
        target: rule.thresholdKm,
        unit: 'km',
      };
    case 'MONTHLY_ACTIVE_WEEKS':
      return {
        current: Math.max(
          0,
          ...getMonthGroups(activities, rule.month).map(
            (values) =>
              new Set(
                values
                  .filter(isOutdoor)
                  .map((activity) => getIsoWeekKey(activity.startedAt)),
              ).size,
          ),
        ),
        target: rule.threshold,
        unit: 'semaines',
      };
  }
}
