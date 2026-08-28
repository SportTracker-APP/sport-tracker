-- A nullable processing marker makes summit detection retryable after an
-- interrupted activity import without changing historical activity data.
ALTER TABLE "Activity"
  ADD COLUMN "summitDetectionProcessedAt" TIMESTAMP(3);

CREATE INDEX "Activity_userId_summitDetectionProcessedAt_idx"
  ON "Activity"("userId", "summitDetectionProcessedAt");

-- Preserve the evidence used for each decision so field-test results remain
-- auditable when the detection algorithm evolves.
ALTER TABLE "SummitDiscovery"
  ADD COLUMN "routePointCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nearbyPointCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "detectionVersion" INTEGER NOT NULL DEFAULT 1;
