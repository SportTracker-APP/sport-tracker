ALTER TABLE "Summit"
  ADD COLUMN "editorialImageUrl" TEXT,
  ADD COLUMN "editorialImageCredit" TEXT,
  ADD COLUMN "editorialSourceUrl" TEXT;

ALTER TYPE "SummitAdminAuditAction" ADD VALUE 'MANUAL_SUMMIT_CREATED';
ALTER TYPE "SummitAdminAuditAction" ADD VALUE 'EDITORIAL_IMAGE_UPDATED';
ALTER TYPE "SummitAdminAuditAction" ADD VALUE 'EDITORIAL_IMAGE_REMOVED';
