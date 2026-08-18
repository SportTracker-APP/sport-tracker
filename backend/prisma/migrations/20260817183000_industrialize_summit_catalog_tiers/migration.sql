CREATE TYPE "SummitCatalogTier" AS ENUM ('CORE', 'SECONDARY', 'REFERENCE');

CREATE TYPE "SummitImportResolutionAction" AS ENUM (
  'MATCH_EXISTING',
  'CREATE_NEW',
  'IGNORE',
  'KEEP_FOR_REVIEW'
);

ALTER TYPE "SummitAdminAuditAction" ADD VALUE 'TIER_CHANGED';
ALTER TYPE "SummitImportRunStatus" ADD VALUE 'PREPARED';
ALTER TYPE "SummitImportCandidateStatus" ADD VALUE 'SKIPPED';

ALTER TABLE "Summit"
  ADD COLUMN "catalogTier" "SummitCatalogTier" NOT NULL DEFAULT 'CORE',
  ADD COLUMN "suggestedTier" "SummitCatalogTier",
  ADD COLUMN "tierReason" TEXT,
  ADD COLUMN "tierUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "tierUpdatedByUserId" TEXT;

ALTER TABLE "SummitImportCandidate"
  ADD COLUMN "suggestedTier" "SummitCatalogTier",
  ADD COLUMN "catalogTier" "SummitCatalogTier",
  ADD COLUMN "tierReason" TEXT,
  ADD COLUMN "classificationSignals" JSONB,
  ADD COLUMN "isLegacyMatch" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "homonymGroupSize" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "resolutionAction" "SummitImportResolutionAction",
  ADD COLUMN "resolvedAt" TIMESTAMP(3),
  ADD COLUMN "resolvedByUserId" TEXT;

-- A previous Phase 8 staging run may already contain candidates. Preserve it
-- with a conservative tier until the classifier is replayed from the admin.
UPDATE "SummitImportCandidate"
SET
  "suggestedTier" = 'CORE',
  "catalogTier" = 'CORE',
  "tierReason" = 'Candidat antérieur à la classification Phase 8.6',
  "classificationSignals" = '{}'::jsonb
WHERE "suggestedTier" IS NULL;

ALTER TABLE "SummitImportCandidate"
  ALTER COLUMN "suggestedTier" SET NOT NULL,
  ALTER COLUMN "catalogTier" SET NOT NULL,
  ALTER COLUMN "tierReason" SET NOT NULL,
  ALTER COLUMN "classificationSignals" SET NOT NULL;

CREATE INDEX "Summit_catalogTier_idx" ON "Summit"("catalogTier");
CREATE INDEX "SummitImportCandidate_suggestedTier_idx" ON "SummitImportCandidate"("suggestedTier");
CREATE INDEX "SummitImportCandidate_catalogTier_idx" ON "SummitImportCandidate"("catalogTier");
CREATE INDEX "SummitImportCandidate_importRunId_status_idx"
  ON "SummitImportCandidate"("importRunId", "status");
CREATE INDEX "SummitImportCandidate_importRunId_catalogTier_idx"
  ON "SummitImportCandidate"("importRunId", "catalogTier");
CREATE INDEX "SummitImportCandidate_importRunId_homonymGroupSize_idx"
  ON "SummitImportCandidate"("importRunId", "homonymGroupSize");
CREATE INDEX "SummitImportCandidate_resolutionAction_idx" ON "SummitImportCandidate"("resolutionAction");
CREATE UNIQUE INDEX "SummitImportRun_provider_sourceVersion_scope_key"
  ON "SummitImportRun"("provider", "sourceVersion", "scope");

ALTER TABLE "Summit"
  ADD CONSTRAINT "Summit_tierUpdatedByUserId_fkey"
  FOREIGN KEY ("tierUpdatedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SummitImportCandidate"
  ADD CONSTRAINT "SummitImportCandidate_resolvedByUserId_fkey"
  FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
