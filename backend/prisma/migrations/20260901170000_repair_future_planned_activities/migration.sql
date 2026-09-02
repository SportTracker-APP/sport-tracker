-- Planning links previously omitted status=PLANNED, so some zero-metric outings
-- were stored with Activity's COMPLETED default. Keep future entries planned and
-- mark past ones missed. This intentionally targets only an unlinked placeholder
-- shape; recorded activities and Strava imports remain untouched.
UPDATE "Activity" AS activity
SET
  "status" = CASE
    WHEN activity."startedAt" > CURRENT_TIMESTAMP THEN 'PLANNED'::"ActivityStatus"
    ELSE 'MISSED'::"ActivityStatus"
  END,
  "summitDetectionProcessedAt" = NULL,
  "summitDetectionVersion" = 0,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE activity."status" = 'COMPLETED'
  AND activity."stravaActivityId" IS NULL
  AND COALESCE(activity."distance", 0) = 0
  AND activity."duration" = 0
  AND COALESCE(activity."elevationGain", 0) = 0
  AND activity."routePolyline" IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "PlannedWorkoutCompletion" AS completion
    WHERE completion."plannedWorkoutId" = activity."id"
       OR completion."completedActivityId" = activity."id"
  );
