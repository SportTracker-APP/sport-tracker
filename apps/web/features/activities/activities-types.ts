export const ACTIVITY_FILTERS = [
  "Tous",
  "Course",
  "Cyclisme",
  "VTT",
  "Trail",
  "Musculation",
  "Randonnée",
] as const;

export type ActivityFilter = (typeof ACTIVITY_FILTERS)[number];

export type ActivityMetric = {
  key: "distance" | "duration" | "elevation" | "calories";
  label: string;
};

export type ActivityRoutePoint = {
  x: number;
  y: number;
};

export type ActivityViewModel = {
  id: string;
  title: string;
  sport: string;
  sportLabel: string;
  typeLabel: string | null;
  startedAt: string;
  dateLabel: string;
  dateDay: string;
  dateMonth: string;
  dateYear: string;
  locationLabel: string | null;
  metrics: ActivityMetric[];
  routePolyline: string | null;
  photoUrl: string | null;
  isFromStrava: boolean;
};

export type ActivityMonthGroup = {
  key: string;
  label: string;
  activities: ActivityViewModel[];
};

export type YearlyJournalSummary = {
  year: number;
  activityCount: number;
  distanceLabel: string;
  durationLabel: string;
  elevationLabel: string | null;
  caloriesLabel: string | null;
  favoriteSportLabel: string | null;
};
