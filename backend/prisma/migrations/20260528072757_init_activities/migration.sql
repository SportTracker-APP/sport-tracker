-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('TRAINING', 'RACE', 'RECOVERY', 'WALK');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SportType" AS ENUM ('RUNNING', 'TRAIL', 'HIKING', 'WALKING', 'ROAD_CYCLING', 'MTB', 'GRAVEL', 'SWIMMING', 'GYM', 'FITNESS', 'SKI', 'SNOWBOARD', 'CLIMBING');

-- CreateEnum
CREATE TYPE "WeatherType" AS ENUM ('SUNNY', 'CLOUDY', 'RAINY', 'SNOWY', 'WINDY', 'FOGGY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "isProfilePublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weight" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ActivityType" NOT NULL,
    "sport" "SportType" NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'COMPLETED',
    "distance" DOUBLE PRECISION,
    "duration" INTEGER NOT NULL,
    "movingTime" INTEGER,
    "elevationGain" INTEGER,
    "elevationLoss" INTEGER,
    "calories" INTEGER,
    "steps" INTEGER,
    "cadence" INTEGER,
    "power" INTEGER,
    "averageSpeed" DOUBLE PRECISION,
    "maxSpeed" DOUBLE PRECISION,
    "pace" DOUBLE PRECISION,
    "averageHeartRate" INTEGER,
    "maxHeartRate" INTEGER,
    "temperature" DOUBLE PRECISION,
    "weather" "WeatherType",
    "startLatitude" DOUBLE PRECISION,
    "startLongitude" DOUBLE PRECISION,
    "endLatitude" DOUBLE PRECISION,
    "endLongitude" DOUBLE PRECISION,
    "city" TEXT,
    "country" TEXT,
    "routePolyline" TEXT,
    "coverImageUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_sport_idx" ON "Activity"("sport");

-- CreateIndex
CREATE INDEX "Activity_startedAt_idx" ON "Activity"("startedAt");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
