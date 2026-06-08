CREATE TYPE "GoalType" AS ENUM ('DISTANCE_KM', 'ACTIVITY_COUNT', 'ELEVATION_M', 'CALORIES', 'DURATION_MIN');

CREATE TYPE "GoalPeriod" AS ENUM ('WEEKLY', 'MONTHLY', 'CUSTOM');

CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "GoalType" NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "period" "GoalPeriod" NOT NULL DEFAULT 'MONTHLY',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

CREATE INDEX "Goal_type_idx" ON "Goal"("type");

CREATE INDEX "Goal_isActive_idx" ON "Goal"("isActive");

CREATE INDEX "Goal_startDate_idx" ON "Goal"("startDate");

CREATE INDEX "Goal_endDate_idx" ON "Goal"("endDate");

ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
