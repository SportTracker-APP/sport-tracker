type ActivityVisibilityInput = {
  status: string;
  completedActivityId?: string | null;
  stravaActivityId?: string | null;
  distance?: number | null;
  duration?: number | null;
  elevationGain?: number | null;
  routePolyline?: string | null;
  startedAt: string;
};

export function isRecordedCompletedActivity(
  activity: ActivityVisibilityInput,
  now = Date.now(),
) {
  if (
    activity.status !== "COMPLETED" ||
    activity.completedActivityId ||
    new Date(activity.startedAt).getTime() > now
  ) {
    return false;
  }

  return Boolean(
    activity.stravaActivityId ||
    activity.routePolyline ||
    (activity.distance ?? 0) > 0 ||
    (activity.duration ?? 0) > 0 ||
    (activity.elevationGain ?? 0) > 0,
  );
}
