-- Existing active summits remain public and are considered ready. New summits
-- default to draft and hidden until an administrator explicitly publishes them.
CREATE TYPE "SummitCatalogStatus" AS ENUM ('DRAFT', 'REVIEW', 'READY', 'ARCHIVED');
CREATE TYPE "SummitAdminAuditAction" AS ENUM (
  'SUMMIT_UPDATED',
  'STATUS_CHANGED',
  'PUBLICATION_CHANGED',
  'PRIMARY_MASSIF_CHANGED',
  'GEO_AREA_ADDED',
  'GEO_AREA_REMOVED'
);

ALTER TABLE "Summit"
ADD COLUMN "catalogStatus" "SummitCatalogStatus" NOT NULL DEFAULT 'DRAFT';

UPDATE "Summit"
SET "catalogStatus" = 'READY'
WHERE "isActive" = true;

ALTER TABLE "Summit"
ALTER COLUMN "isActive" SET DEFAULT false;

CREATE TABLE "SummitAdminAuditLog" (
  "id" TEXT NOT NULL,
  "summitId" TEXT NOT NULL,
  "adminUserId" TEXT,
  "action" "SummitAdminAuditAction" NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SummitAdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Summit_catalogStatus_idx" ON "Summit"("catalogStatus");
CREATE INDEX "SummitAdminAuditLog_summitId_createdAt_idx"
ON "SummitAdminAuditLog"("summitId", "createdAt");
CREATE INDEX "SummitAdminAuditLog_adminUserId_createdAt_idx"
ON "SummitAdminAuditLog"("adminUserId", "createdAt");
CREATE INDEX "SummitAdminAuditLog_action_idx"
ON "SummitAdminAuditLog"("action");

ALTER TABLE "SummitAdminAuditLog"
ADD CONSTRAINT "SummitAdminAuditLog_summitId_fkey"
FOREIGN KEY ("summitId") REFERENCES "Summit"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SummitAdminAuditLog"
ADD CONSTRAINT "SummitAdminAuditLog_adminUserId_fkey"
FOREIGN KEY ("adminUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
