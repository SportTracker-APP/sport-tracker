-- Persist the immutable preflight counters used to approve a departmental
-- release. Historical import runs remain valid with a NULL report.
ALTER TABLE "SummitImportRun"
  ADD COLUMN "preflightReport" JSONB;
