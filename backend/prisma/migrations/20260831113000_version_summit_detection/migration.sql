ALTER TABLE "Activity"
ADD COLUMN "summitDetectionVersion" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Activity_userId_summitDetectionVersion_idx"
ON "Activity"("userId", "summitDetectionVersion");
