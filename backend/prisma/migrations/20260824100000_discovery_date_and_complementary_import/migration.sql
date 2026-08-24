ALTER TYPE "SummitAdminAuditAction" ADD VALUE 'IMPORT_COMPLEMENTARY_APPLIED';

ALTER TABLE "SummitDiscovery"
  ADD COLUMN "discoveredAt" TIMESTAMP(3);

UPDATE "SummitDiscovery" AS discovery
SET "discoveredAt" = activity."startedAt"
FROM "Activity" AS activity
WHERE activity."id" = discovery."activityId";

ALTER TABLE "SummitDiscovery"
  ALTER COLUMN "discoveredAt" SET NOT NULL;

CREATE INDEX "SummitDiscovery_discoveredAt_idx"
  ON "SummitDiscovery"("discoveredAt");

ALTER TABLE "SummitImportCandidate"
  ADD COLUMN "appliedAt" TIMESTAMP(3),
  ADD COLUMN "appliedByUserId" TEXT;

CREATE INDEX "SummitImportCandidate_appliedAt_idx"
  ON "SummitImportCandidate"("appliedAt");

CREATE INDEX "SummitImportCandidate_appliedByUserId_idx"
  ON "SummitImportCandidate"("appliedByUserId");

ALTER TABLE "SummitImportCandidate"
  ADD CONSTRAINT "SummitImportCandidate_appliedByUserId_fkey"
  FOREIGN KEY ("appliedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
