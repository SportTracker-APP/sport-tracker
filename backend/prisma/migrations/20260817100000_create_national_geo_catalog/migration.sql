CREATE TYPE "GeoAreaType" AS ENUM (
    'COUNTRY',
    'ADMIN_REGION',
    'DEPARTMENT',
    'MOUNTAIN_CHAIN',
    'MASSIF',
    'SUBMASSIF',
    'SECTOR',
    'NATURAL_PARK'
);

CREATE TYPE "UserGeoAreaPreferenceType" AS ENUM (
    'HOME_AREA',
    'FAVORITE',
    'DISCOVERY'
);

CREATE TABLE "GeoArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "GeoAreaType" NOT NULL,
    "parentId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoArea_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SummitGeoArea" (
    "summitId" TEXT NOT NULL,
    "geoAreaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SummitGeoArea_pkey" PRIMARY KEY ("summitId", "geoAreaId")
);

CREATE TABLE "UserGeoAreaPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "geoAreaId" TEXT NOT NULL,
    "type" "UserGeoAreaPreferenceType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGeoAreaPreference_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Summit" ADD COLUMN "primaryMassifId" TEXT;

CREATE UNIQUE INDEX "GeoArea_slug_key" ON "GeoArea"("slug");
CREATE INDEX "GeoArea_type_idx" ON "GeoArea"("type");
CREATE INDEX "GeoArea_parentId_idx" ON "GeoArea"("parentId");
CREATE INDEX "GeoArea_isPublished_idx" ON "GeoArea"("isPublished");
CREATE INDEX "SummitGeoArea_geoAreaId_idx" ON "SummitGeoArea"("geoAreaId");
CREATE UNIQUE INDEX "UserGeoAreaPreference_userId_geoAreaId_type_key"
    ON "UserGeoAreaPreference"("userId", "geoAreaId", "type");
CREATE INDEX "UserGeoAreaPreference_userId_type_idx"
    ON "UserGeoAreaPreference"("userId", "type");
CREATE INDEX "UserGeoAreaPreference_geoAreaId_idx"
    ON "UserGeoAreaPreference"("geoAreaId");
CREATE INDEX "Summit_primaryMassifId_idx" ON "Summit"("primaryMassifId");

ALTER TABLE "GeoArea"
    ADD CONSTRAINT "GeoArea_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "GeoArea"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SummitGeoArea"
    ADD CONSTRAINT "SummitGeoArea_summitId_fkey"
    FOREIGN KEY ("summitId") REFERENCES "Summit"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SummitGeoArea"
    ADD CONSTRAINT "SummitGeoArea_geoAreaId_fkey"
    FOREIGN KEY ("geoAreaId") REFERENCES "GeoArea"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserGeoAreaPreference"
    ADD CONSTRAINT "UserGeoAreaPreference_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserGeoAreaPreference"
    ADD CONSTRAINT "UserGeoAreaPreference_geoAreaId_fkey"
    FOREIGN KEY ("geoAreaId") REFERENCES "GeoArea"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Summit"
    ADD CONSTRAINT "Summit_primaryMassifId_fkey"
    FOREIGN KEY ("primaryMassifId") REFERENCES "GeoArea"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "GeoArea" (
    "id", "name", "slug", "type", "parentId", "isPublished", "updatedAt"
) VALUES
    ('geo-france', 'France', 'france', 'COUNTRY', NULL, true, CURRENT_TIMESTAMP),
    ('geo-alpes', 'Alpes', 'alpes', 'MOUNTAIN_CHAIN', 'geo-france', true, CURRENT_TIMESTAMP),
    ('geo-alpes-du-nord', 'Alpes du Nord', 'alpes-du-nord', 'SECTOR', 'geo-alpes', true, CURRENT_TIMESTAMP),
    ('geo-alpes-du-sud', 'Alpes du Sud', 'alpes-du-sud', 'SECTOR', 'geo-alpes', false, CURRENT_TIMESTAMP),
    ('geo-massif-du-mont-blanc', 'Mont-Blanc', 'massif-du-mont-blanc', 'MASSIF', 'geo-alpes-du-nord', true, CURRENT_TIMESTAMP),
    ('geo-bauges', 'Bauges', 'bauges', 'MASSIF', 'geo-alpes-du-nord', true, CURRENT_TIMESTAMP),
    ('geo-aravis', 'Aravis', 'aravis', 'MASSIF', 'geo-alpes-du-nord', true, CURRENT_TIMESTAMP),
    ('geo-vanoise', 'Vanoise', 'vanoise', 'MASSIF', 'geo-alpes-du-nord', false, CURRENT_TIMESTAMP),
    ('geo-chartreuse', 'Chartreuse', 'chartreuse', 'MASSIF', 'geo-alpes-du-nord', false, CURRENT_TIMESTAMP),
    ('geo-annecy', 'Annecy', 'annecy', 'MASSIF', 'geo-alpes-du-nord', true, CURRENT_TIMESTAMP),
    ('geo-bornes', 'Bornes', 'bornes', 'MASSIF', 'geo-alpes-du-nord', true, CURRENT_TIMESTAMP),
    ('geo-bargy', 'Bargy', 'bargy', 'MASSIF', 'geo-alpes-du-nord', true, CURRENT_TIMESTAMP),
    ('geo-chablais', 'Chablais', 'chablais', 'MASSIF', 'geo-alpes-du-nord', true, CURRENT_TIMESTAMP),
    ('geo-aiguilles-rouges', 'Aiguilles Rouges', 'aiguilles-rouges', 'MASSIF', 'geo-alpes-du-nord', true, CURRENT_TIMESTAMP),
    ('geo-pyrenees', 'Pyrénées', 'pyrenees', 'MOUNTAIN_CHAIN', 'geo-france', false, CURRENT_TIMESTAMP),
    ('geo-jura', 'Jura', 'jura', 'MOUNTAIN_CHAIN', 'geo-france', false, CURRENT_TIMESTAMP),
    ('geo-vosges', 'Vosges', 'vosges', 'MOUNTAIN_CHAIN', 'geo-france', false, CURRENT_TIMESTAMP),
    ('geo-massif-central', 'Massif central', 'massif-central', 'MOUNTAIN_CHAIN', 'geo-france', false, CURRENT_TIMESTAMP),
    ('geo-corse', 'Corse', 'corse', 'MOUNTAIN_CHAIN', 'geo-france', false, CURRENT_TIMESTAMP);

-- Preserve any legacy massif that is present in the database but absent from
-- the initial national reference. Its deterministic hash keeps the migration
-- idempotent while avoiding assumptions about future names or accents.
INSERT INTO "GeoArea" (
    "id", "name", "slug", "type", "parentId", "isPublished", "updatedAt"
)
SELECT DISTINCT
    'geo-legacy-' || md5(s."massif"),
    s."massif",
    'legacy-massif-' || md5(s."massif"),
    'MASSIF'::"GeoAreaType",
    'geo-alpes-du-nord',
    true,
    CURRENT_TIMESTAMP
FROM "Summit" s
WHERE NOT EXISTS (
    SELECT 1
    FROM "GeoArea" area
    WHERE area."type" = 'MASSIF' AND area."name" = s."massif"
);

UPDATE "Summit" summit
SET "primaryMassifId" = area."id"
FROM "GeoArea" area
WHERE area."type" = 'MASSIF'
  AND area."name" = summit."massif";

WITH RECURSIVE summit_areas AS (
    SELECT
        summit."id" AS "summitId",
        area."id" AS "geoAreaId",
        area."parentId"
    FROM "Summit" summit
    JOIN "GeoArea" area ON area."id" = summit."primaryMassifId"

    UNION ALL

    SELECT
        summit_areas."summitId",
        parent."id" AS "geoAreaId",
        parent."parentId"
    FROM summit_areas
    JOIN "GeoArea" parent ON parent."id" = summit_areas."parentId"
)
INSERT INTO "SummitGeoArea" ("summitId", "geoAreaId")
SELECT DISTINCT "summitId", "geoAreaId"
FROM summit_areas
ON CONFLICT ("summitId", "geoAreaId") DO NOTHING;
