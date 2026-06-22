-- AlterEnum
ALTER TYPE "ActivityStatus" ADD VALUE IF NOT EXISTS 'CANCELED';

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlannedWorkoutCompletion" (
  "id" TEXT NOT NULL,
  "plannedWorkoutId" TEXT NOT NULL,
  "completedActivityId" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "celebrationSeenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PlannedWorkoutCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PlannedWorkoutCompletion_plannedWorkoutId_key" ON "PlannedWorkoutCompletion"("plannedWorkoutId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PlannedWorkoutCompletion_completedActivityId_key" ON "PlannedWorkoutCompletion"("completedActivityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlannedWorkoutCompletion_plannedWorkoutId_idx" ON "PlannedWorkoutCompletion"("plannedWorkoutId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlannedWorkoutCompletion_completedActivityId_idx" ON "PlannedWorkoutCompletion"("completedActivityId");

-- AddForeignKey
ALTER TABLE "PlannedWorkoutCompletion" ADD CONSTRAINT "PlannedWorkoutCompletion_plannedWorkoutId_fkey" FOREIGN KEY ("plannedWorkoutId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedWorkoutCompletion" ADD CONSTRAINT "PlannedWorkoutCompletion_completedActivityId_fkey" FOREIGN KEY ("completedActivityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
