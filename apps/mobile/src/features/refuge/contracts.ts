export type RefugeActivity = {
  calories?: number | null;
  city?: string | null;
  completedActivityId?: string | null;
  country?: string | null;
  distance?: number | null;
  /** Minutes, matching the current API and Strava import. */
  duration?: number | null;
  description?: string | null;
  elevationGain?: number | null;
  id: string;
  routePolyline?: string | null;
  sport: string;
  startedAt: string;
  status: string;
  stravaActivityId?: string | null;
  title?: string | null;
};

export type RefugeGoalType =
  | 'ACTIVITY_COUNT'
  | 'CALORIES'
  | 'DISTANCE_KM'
  | 'DURATION_MIN'
  | 'ELEVATION_M';

export type RefugeGoal = {
  createdAt: string;
  endDate: string;
  id: string;
  isActive: boolean;
  isPrimary?: boolean;
  period: 'CUSTOM' | 'MONTHLY' | 'WEEKLY';
  sport?: string | null;
  startDate: string;
  target: number;
  title: string;
  type: RefugeGoalType;
};

export type RefugeSummit = {
  altitude?: number | null;
  discovered: boolean;
  geoAreas?: {
    name: string;
    type: string;
  }[];
  id: string;
  latestDiscoveredAt?: string | null;
  massif?: string | null;
  name: string;
  primaryMassif?: {
    name: string;
  } | null;
};

export type RefugeBadge = {
  category?: string;
  description?: string;
  id: string;
  name: string;
  progress?: {
    current: number;
    target: number;
    unit: string;
  } | null;
  unlocked: boolean;
  unlockedAt?: string | null;
};

export type RefugeResourceKey = 'activities' | 'badges' | 'goals' | 'summits';
