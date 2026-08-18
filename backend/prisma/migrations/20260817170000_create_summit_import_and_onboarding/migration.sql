CREATE TYPE "SummitExternalProvider" AS ENUM ('IGN_BD_TOPO');

ALTER TYPE "SummitAdminAuditAction" ADD VALUE 'IMPORT_BATCH_PUBLISHED';

CREATE TYPE "SummitImportRunStatus" AS ENUM (
  'PREVIEWED',
  'APPLIED',
  'PUBLISHED',
  'FAILED'
);

CREATE TYPE "SummitImportCandidateStatus" AS ENUM (
  'NEW',
  'MATCHED',
  'CONFLICT',
  'REJECTED',
  'READY',
  'IMPORTED'
);

INSERT INTO "GeoArea" (
  "id", "name", "slug", "type", "parentId", "isPublished", "updatedAt"
) VALUES
  (
    'geo-auvergne-rhone-alpes',
    'Auvergne-Rhône-Alpes',
    'auvergne-rhone-alpes',
    'ADMIN_REGION',
    'geo-france',
    true,
    CURRENT_TIMESTAMP
  ),
  (
    'geo-haute-savoie',
    'Haute-Savoie',
    'haute-savoie',
    'DEPARTMENT',
    'geo-auvergne-rhone-alpes',
    true,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "type" = EXCLUDED."type",
  "parentId" = EXCLUDED."parentId",
  "isPublished" = EXCLUDED."isPublished",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "SummitGeoArea" ("summitId", "geoAreaId")
SELECT summit."id", area."id"
FROM "Summit" summit
CROSS JOIN "GeoArea" area
WHERE area."slug" IN ('france', 'auvergne-rhone-alpes', 'haute-savoie')
ON CONFLICT ("summitId", "geoAreaId") DO NOTHING;

CREATE TABLE "UserOnboardingState" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserOnboardingState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SummitExternalReference" (
  "id" TEXT NOT NULL,
  "summitId" TEXT NOT NULL,
  "provider" "SummitExternalProvider" NOT NULL,
  "externalId" TEXT NOT NULL,
  "sourceVersion" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SummitExternalReference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SummitImportRun" (
  "id" TEXT NOT NULL,
  "provider" "SummitExternalProvider" NOT NULL,
  "scope" TEXT NOT NULL,
  "sourceVersion" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceChecksum" TEXT,
  "status" "SummitImportRunStatus" NOT NULL DEFAULT 'PREVIEWED',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "sourceCount" INTEGER NOT NULL DEFAULT 0,
  "candidateCount" INTEGER NOT NULL DEFAULT 0,
  "createdCount" INTEGER NOT NULL DEFAULT 0,
  "matchedCount" INTEGER NOT NULL DEFAULT 0,
  "conflictCount" INTEGER NOT NULL DEFAULT 0,
  "rejectedCount" INTEGER NOT NULL DEFAULT 0,
  "errorCount" INTEGER NOT NULL DEFAULT 0,
  "appliedAt" TIMESTAMP(3),
  "appliedByUserId" TEXT,
  "publishedAt" TIMESTAMP(3),
  "publishedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SummitImportRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SummitImportCandidate" (
  "id" TEXT NOT NULL,
  "importRunId" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "elevation" INTEGER,
  "sourceNature" TEXT NOT NULL,
  "sourceProperties" JSONB NOT NULL,
  "status" "SummitImportCandidateStatus" NOT NULL,
  "matchedSummitId" TEXT,
  "resolutionReason" TEXT,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SummitImportCandidate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserOnboardingState_userId_key_key"
ON "UserOnboardingState"("userId", "key");
CREATE INDEX "UserOnboardingState_key_version_idx"
ON "UserOnboardingState"("key", "version");

CREATE UNIQUE INDEX "SummitExternalReference_provider_externalId_key"
ON "SummitExternalReference"("provider", "externalId");
CREATE INDEX "SummitExternalReference_summitId_idx"
ON "SummitExternalReference"("summitId");

CREATE INDEX "SummitImportRun_provider_scope_startedAt_idx"
ON "SummitImportRun"("provider", "scope", "startedAt");
CREATE INDEX "SummitImportRun_status_idx"
ON "SummitImportRun"("status");

CREATE UNIQUE INDEX "SummitImportCandidate_importRunId_externalId_key"
ON "SummitImportCandidate"("importRunId", "externalId");
CREATE INDEX "SummitImportCandidate_status_idx"
ON "SummitImportCandidate"("status");
CREATE INDEX "SummitImportCandidate_matchedSummitId_idx"
ON "SummitImportCandidate"("matchedSummitId");

ALTER TABLE "UserOnboardingState"
ADD CONSTRAINT "UserOnboardingState_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SummitExternalReference"
ADD CONSTRAINT "SummitExternalReference_summitId_fkey"
FOREIGN KEY ("summitId") REFERENCES "Summit"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SummitImportRun"
ADD CONSTRAINT "SummitImportRun_appliedByUserId_fkey"
FOREIGN KEY ("appliedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SummitImportRun"
ADD CONSTRAINT "SummitImportRun_publishedByUserId_fkey"
FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SummitImportCandidate"
ADD CONSTRAINT "SummitImportCandidate_importRunId_fkey"
FOREIGN KEY ("importRunId") REFERENCES "SummitImportRun"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SummitImportCandidate"
ADD CONSTRAINT "SummitImportCandidate_matchedSummitId_fkey"
FOREIGN KEY ("matchedSummitId") REFERENCES "Summit"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
