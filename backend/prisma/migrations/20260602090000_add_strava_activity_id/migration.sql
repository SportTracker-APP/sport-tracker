-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "stravaActivityId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Activity_stravaActivityId_key" ON "Activity"("stravaActivityId");
