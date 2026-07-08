CREATE TYPE "SummitDiscoveryStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DISMISSED');

CREATE TABLE "Summit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] NOT NULL,
    "altitude" INTEGER NOT NULL,
    "massif" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "imageCredit" TEXT,
    "sourceUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Summit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SummitDiscovery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "summitId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "status" "SummitDiscoveryStatus" NOT NULL DEFAULT 'PENDING',
    "confidence" DOUBLE PRECISION NOT NULL,
    "closestDistance" INTEGER NOT NULL,
    "altitudeMatched" BOOLEAN NOT NULL,
    "titleMatched" BOOLEAN NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SummitDiscovery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "sourceDiscoveryId" TEXT,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificationSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Summit_massif_idx" ON "Summit"("massif");
CREATE INDEX "Summit_altitude_idx" ON "Summit"("altitude");
CREATE INDEX "Summit_isActive_idx" ON "Summit"("isActive");
CREATE UNIQUE INDEX "SummitDiscovery_summitId_activityId_key" ON "SummitDiscovery"("summitId", "activityId");
CREATE INDEX "SummitDiscovery_userId_status_idx" ON "SummitDiscovery"("userId", "status");
CREATE INDEX "SummitDiscovery_userId_summitId_idx" ON "SummitDiscovery"("userId", "summitId");
CREATE INDEX "SummitDiscovery_activityId_idx" ON "SummitDiscovery"("activityId");
CREATE INDEX "SummitDiscovery_detectedAt_idx" ON "SummitDiscovery"("detectedAt");
CREATE INDEX "Badge_sortOrder_idx" ON "Badge"("sortOrder");
CREATE INDEX "Badge_isActive_idx" ON "Badge"("isActive");
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");
CREATE INDEX "UserBadge_badgeId_idx" ON "UserBadge"("badgeId");
CREATE INDEX "UserBadge_sourceDiscoveryId_idx" ON "UserBadge"("sourceDiscoveryId");
CREATE INDEX "UserBadge_unlockedAt_idx" ON "UserBadge"("unlockedAt");

ALTER TABLE "SummitDiscovery" ADD CONSTRAINT "SummitDiscovery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SummitDiscovery" ADD CONSTRAINT "SummitDiscovery_summitId_fkey" FOREIGN KEY ("summitId") REFERENCES "Summit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SummitDiscovery" ADD CONSTRAINT "SummitDiscovery_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_sourceDiscoveryId_fkey" FOREIGN KEY ("sourceDiscoveryId") REFERENCES "SummitDiscovery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
