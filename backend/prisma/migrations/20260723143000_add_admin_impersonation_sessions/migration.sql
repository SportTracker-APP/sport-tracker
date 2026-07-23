-- CreateTable
CREATE TABLE "AdminImpersonationSession" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT,
    "targetUserId" TEXT,
    "adminEmail" TEXT NOT NULL,
    "targetEmail" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "AdminImpersonationSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminImpersonationSession_adminUserId_startedAt_idx"
ON "AdminImpersonationSession"("adminUserId", "startedAt");

-- CreateIndex
CREATE INDEX "AdminImpersonationSession_targetUserId_startedAt_idx"
ON "AdminImpersonationSession"("targetUserId", "startedAt");

-- CreateIndex
CREATE INDEX "AdminImpersonationSession_expiresAt_idx"
ON "AdminImpersonationSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "AdminImpersonationSession"
ADD CONSTRAINT "AdminImpersonationSession_adminUserId_fkey"
FOREIGN KEY ("adminUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminImpersonationSession"
ADD CONSTRAINT "AdminImpersonationSession_targetUserId_fkey"
FOREIGN KEY ("targetUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
