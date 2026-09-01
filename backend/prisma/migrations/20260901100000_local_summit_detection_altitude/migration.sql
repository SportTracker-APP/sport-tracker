CREATE TYPE "SummitDiscoveryAltitudeSource" AS ENUM ('IGN_RGE_ALTI');

ALTER TABLE "SummitDiscovery"
  ADD COLUMN "closestRouteAltitude" INTEGER,
  ADD COLUMN "altitudeSource" "SummitDiscoveryAltitudeSource";
