import { SportType } from '@prisma/client';

export const MISSING_ACTIVITY_VALUE = '—';
export const MISSING_ACTIVITY_LOCATION = 'Lieu non renseigné';

const sportLabels: Record<SportType, string> = {
  RUNNING: 'Course à pied',
  TRAIL: 'Trail',
  HIKING: 'Randonnée',
  WALKING: 'Marche',
  ROAD_CYCLING: 'Vélo de route',
  MTB: 'VTT',
  GRAVEL: 'Gravel',
  SWIMMING: 'Natation',
  GYM: 'Salle de sport',
  FITNESS: 'Fitness',
  SKI: 'Ski',
  SNOWBOARD: 'Snowboard',
  CLIMBING: 'Escalade',
};

export function formatActivityDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatActivityTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

export function formatActivityName(title: string | null): string {
  return title?.trim() || 'Séance outdoor';
}

export function formatActivityLocation(input: {
  city: string | null;
  country: string | null;
}): string {
  const parts = [input.city, input.country].filter((value): value is string =>
    Boolean(value?.trim()),
  );

  return parts.length > 0 ? parts.join(', ') : MISSING_ACTIVITY_LOCATION;
}

export function formatSportName(sport: SportType): string {
  return sportLabels[sport];
}

export function formatDistance(distance: number | null): string {
  if (distance === null) {
    return MISSING_ACTIVITY_VALUE;
  }

  return `${new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: distance % 1 === 0 ? 0 : 1,
  }).format(distance)} km`;
}

export function formatDuration(durationInSeconds: number | null): string {
  if (durationInSeconds === null) {
    return MISSING_ACTIVITY_VALUE;
  }

  const totalMinutes = Math.round(durationInSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes}`;
}

export function formatElevationGain(elevationGain: number | null): string {
  if (elevationGain === null) {
    return MISSING_ACTIVITY_VALUE;
  }

  return `${elevationGain} m D+`;
}
