CREATE TYPE "SummitDiscoveryConfirmationSource" AS ENUM ('AUTO', 'USER');

ALTER TABLE "SummitDiscovery"
  ADD COLUMN "confirmationSource" "SummitDiscoveryConfirmationSource";

UPDATE "SummitDiscovery"
SET "confirmationSource" = CASE
  WHEN ABS(EXTRACT(EPOCH FROM ("confirmedAt" - "detectedAt"))) <= 5
    THEN 'AUTO'::"SummitDiscoveryConfirmationSource"
  ELSE 'USER'::"SummitDiscoveryConfirmationSource"
END
WHERE "status" = 'CONFIRMED'
  AND "confirmedAt" IS NOT NULL;

CREATE INDEX "SummitDiscovery_confirmationSource_idx"
  ON "SummitDiscovery"("confirmationSource");

-- Mont Baron (Annecy): the historical summit carried the discoveries but an
-- IGN conflict was published as a second Summit. Keep the historical identity,
-- move the IGN lineage to it, and use the verified physical peak coordinates.
INSERT INTO "SummitGeoArea" ("summitId", "geoAreaId", "createdAt")
SELECT 'mont-baron', "geoAreaId", "createdAt"
FROM "SummitGeoArea"
WHERE "summitId" = 'ign-bd-topo-paiorogr0000000067336005'
ON CONFLICT ("summitId", "geoAreaId") DO NOTHING;

UPDATE "SummitExternalReference"
SET "summitId" = 'mont-baron', "updatedAt" = NOW()
WHERE "summitId" = 'ign-bd-topo-paiorogr0000000067336005';

UPDATE "SummitImportCandidate"
SET
  "matchedSummitId" = 'mont-baron',
  "isLegacyMatch" = TRUE,
  "resolutionAction" = 'MATCH_EXISTING',
  "resolutionReason" = 'Fusion géographique : sommet historique conservé, point culminant vérifié',
  "updatedAt" = NOW()
WHERE "externalId" = 'PAIOROGR0000000067336005';

UPDATE "SummitAdminAuditLog"
SET "summitId" = 'mont-baron'
WHERE "summitId" = 'ign-bd-topo-paiorogr0000000067336005';

DELETE FROM "Summit"
WHERE "id" = 'ign-bd-topo-paiorogr0000000067336005';

UPDATE "Summit"
SET
  "altitude" = 1299,
  "latitude" = 45.896916,
  "longitude" = 6.1859291,
  "updatedAt" = NOW()
WHERE "id" = 'mont-baron';

INSERT INTO "SummitAdminAuditLog"
  ("id", "summitId", "action", "before", "after", "createdAt")
SELECT
  'geo-repair-mont-baron-20260824',
  'mont-baron',
  'SUMMIT_UPDATED',
  '{"altitude":1299,"latitude":45.914,"longitude":6.181,"duplicateSummitId":"ign-bd-topo-paiorogr0000000067336005"}'::jsonb,
  '{"altitude":1299,"latitude":45.896916,"longitude":6.1859291,"duplicateMerged":true}'::jsonb,
  NOW()
WHERE EXISTS (SELECT 1 FROM "Summit" WHERE "id" = 'mont-baron')
ON CONFLICT ("id") DO NOTHING;

-- Dents de Lanfon: the legacy point was on the southern flank. Move the
-- catalogue identity to the named OSM peak and retain the former spelling.
UPDATE "Summit"
SET
  "name" = 'Dents de Lanfon',
  "aliases" = ARRAY(
    SELECT DISTINCT alias
    FROM UNNEST("aliases" || ARRAY['Dent de Lanfon']::TEXT[]) AS alias
  ),
  "altitude" = 1828,
  "latitude" = 45.8611556,
  "longitude" = 6.2416125,
  "updatedAt" = NOW()
WHERE "id" = 'dent-de-lanfon';

INSERT INTO "SummitAdminAuditLog"
  ("id", "summitId", "action", "before", "after", "createdAt")
SELECT
  'geo-repair-dents-lanfon-20260824',
  'dent-de-lanfon',
  'SUMMIT_UPDATED',
  '{"name":"Dent de Lanfon","altitude":1824,"latitude":45.849,"longitude":6.251}'::jsonb,
  '{"name":"Dents de Lanfon","altitude":1828,"latitude":45.8611556,"longitude":6.2416125}'::jsonb,
  NOW()
WHERE EXISTS (SELECT 1 FROM "Summit" WHERE "id" = 'dent-de-lanfon')
ON CONFLICT ("id") DO NOTHING;
