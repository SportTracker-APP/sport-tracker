export const ACTIVITY_SPORTS = [
  { value: 'HIKING', label: 'Randonnée', icon: 'footsteps-outline' },
  { value: 'TRAIL', label: 'Trail', icon: 'walk-outline' },
  { value: 'RUNNING', label: 'Course à pied', icon: 'walk-outline' },
  { value: 'WALKING', label: 'Marche', icon: 'footsteps-outline' },
  { value: 'ROAD_CYCLING', label: 'Vélo de route', icon: 'bicycle-outline' },
  { value: 'MTB', label: 'VTT', icon: 'bicycle-outline' },
  { value: 'GRAVEL', label: 'Gravel', icon: 'bicycle-outline' },
  { value: 'SWIMMING', label: 'Natation', icon: 'water-outline' },
  { value: 'GYM', label: 'Musculation', icon: 'barbell-outline' },
  { value: 'FITNESS', label: 'Fitness', icon: 'fitness-outline' },
  { value: 'SKI', label: 'Ski', icon: 'snow-outline' },
  { value: 'SNOWBOARD', label: 'Snowboard', icon: 'snow-outline' },
  { value: 'CLIMBING', label: 'Escalade', icon: 'triangle-outline' },
] as const;

export type ActivitySport = (typeof ACTIVITY_SPORTS)[number]['value'];
export type ActivityDraft = {
  sport: ActivitySport;
  title: string;
  date: string;
  time: string;
  hours: string;
  minutes: string;
  distance: string;
  elevationGain: string;
  city: string;
  notes: string;
};
export type ActivityFormErrors = Partial<Record<keyof ActivityDraft, string>>;

/** Matches POST /activities. The current API and Strava importer store duration in minutes. */
export type CreateActivityPayload = {
  type: 'TRAINING';
  status: 'COMPLETED';
  sport: ActivitySport;
  startedAt: string;
  duration: number;
  title?: string;
  description?: string;
  distance?: number;
  elevationGain?: number;
  city?: string;
};

const pad = (value: number) => String(value).padStart(2, '0');

export function localDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function createActivityDraft(now = new Date()): ActivityDraft {
  return {
    sport: 'HIKING',
    title: '',
    date: localDateKey(now),
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    hours: '',
    minutes: '',
    distance: '',
    elevationGain: '',
    city: '',
    notes: '',
  };
}

export function parseLocalStart(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time))
    return null;
  const [year, month, day] = date.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  const [hour, minute] = time.split(':').map(Number) as [number, number];
  const result = new Date(year, month - 1, day, hour, minute);
  // Reject rollovers, impossible days, and local times skipped at a DST change.
  return result.getFullYear() === year &&
    result.getMonth() === month - 1 &&
    result.getDate() === day &&
    result.getHours() === hour &&
    result.getMinutes() === minute
    ? result
    : null;
}

export function calendarDays(month: Date): (string | null)[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const offset = (first.getDay() + 6) % 7;
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const cells: (string | null)[] = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= count; day++)
    cells.push(
      localDateKey(new Date(month.getFullYear(), month.getMonth(), day, 12)),
    );
  while (cells.length % 7) cells.push(null);
  return cells;
}

function optionalNumber(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  if (!/^\d+(?:[.,]\d+)?$/.test(trimmed)) return Number.NaN;
  return Number(trimmed.replace(',', '.'));
}

export function validateActivityDraft(
  draft: ActivityDraft,
  now = new Date(),
):
  | { ok: true; payload: CreateActivityPayload }
  | { ok: false; errors: ActivityFormErrors } {
  const errors: ActivityFormErrors = {};
  if (!ACTIVITY_SPORTS.some(({ value }) => value === draft.sport))
    errors.sport = 'Choisis un sport.';
  if (draft.title.trim().length > 120) errors.title = '120 caractères maximum.';
  if (draft.notes.trim().length > 500) errors.notes = '500 caractères maximum.';
  const startedAt = parseLocalStart(draft.date, draft.time);
  if (!parseLocalStart(draft.date, '12:00'))
    errors.date = 'Choisis une date valide.';
  else if (!startedAt)
    errors.time = 'Indique une heure valide au format 09:30.';
  else if (startedAt > now)
    errors.time = 'Le départ doit être dans le passé pour une sortie terminée.';

  const hours =
    draft.hours.trim() === ''
      ? 0
      : /^\d+$/.test(draft.hours.trim())
        ? Number(draft.hours)
        : Number.NaN;
  const minutes =
    draft.minutes.trim() === ''
      ? 0
      : /^\d+$/.test(draft.minutes.trim())
        ? Number(draft.minutes)
        : Number.NaN;
  if (!Number.isSafeInteger(hours) || hours < 0)
    errors.hours = 'Indique un nombre entier positif.';
  if (!Number.isSafeInteger(minutes) || minutes < 0 || minutes > 59)
    errors.minutes = 'Entre 0 et 59 minutes.';
  const duration = hours * 60 + minutes;
  if (
    !errors.hours &&
    !errors.minutes &&
    (duration <= 0 || duration > 2_147_483_647)
  )
    errors.minutes = 'Renseigne la durée de ta sortie.';
  const distance = optionalNumber(draft.distance);
  const elevationGain = optionalNumber(draft.elevationGain);
  if (distance !== undefined && !Number.isFinite(distance))
    errors.distance = 'Indique une distance positive, par exemple 8,5.';
  if (
    elevationGain !== undefined &&
    (!Number.isSafeInteger(elevationGain) || elevationGain > 2_147_483_647)
  )
    errors.elevationGain = 'Indique un nombre entier de mètres.';
  if (Object.keys(errors).length || !startedAt) return { ok: false, errors };

  return {
    ok: true,
    payload: {
      type: 'TRAINING',
      status: 'COMPLETED',
      sport: draft.sport,
      startedAt: startedAt.toISOString(),
      duration,
      ...(draft.title.trim() ? { title: draft.title.trim() } : {}),
      ...(draft.notes.trim() ? { description: draft.notes.trim() } : {}),
      ...(draft.city.trim() ? { city: draft.city.trim() } : {}),
      ...(distance !== undefined ? { distance } : {}),
      ...(elevationGain !== undefined ? { elevationGain } : {}),
    },
  };
}

export function formatActivityDuration(value?: number | null) {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  const minutes = Math.round(value);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours} h ${pad(minutes % 60)}` : `${minutes} min`;
}

export function getActivitySport(sport: string) {
  return ACTIVITY_SPORTS.find(({ value }) => value === sport);
}
