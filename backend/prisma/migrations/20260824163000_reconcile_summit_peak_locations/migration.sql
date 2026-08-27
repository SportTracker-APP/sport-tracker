-- IGN "Détail orographique" records are named cartographic points, not always
-- the physical high point. Correct strong, unique OSM natural=peak matches
-- that were independently audited, while preserving the original IGN lineage.
WITH corrections("summitId", "latitude", "longitude", "altitude", "source") AS (
  VALUES
    ('cret-de-chatillon', 45.7971786, 6.1046213, 1702, 'OSM node 26862742'),
    ('pointe-percee', 45.9557596, 6.5559471, 2750, 'OSM node 26864345'),
    ('aiguille-du-midi', 45.8787035, 6.8875506, 3842, 'OSM node 167075493'),
    ('ign-bd-topo-paiorogr0000000067334345', 46.3529787, 6.7313182, 2221, 'OSM node 5017749145'),
    ('ign-bd-topo-paiorogr0000000067334421', 46.3167188, 6.5318842, 1413, 'OSM node 368218562'),
    ('ign-bd-topo-paiorogr0000000067334460', 46.3077863, 6.3579817, 739, 'OSM node 4329820281'),
    ('ign-bd-topo-paiorogr0000000067334555', 46.2556203, 6.4450444, 1249, 'OSM node 4326816899'),
    ('ign-bd-topo-paiorogr0000000067334641', 46.2304018, 6.4961721, 1607, 'OSM node 26863754'),
    ('ign-bd-topo-paiorogr0000000067334673', 46.1815308, 6.8009439, 2346, 'OSM node 3292304321'),
    ('ign-bd-topo-paiorogr0000000067334705', 46.1975701, 6.3489655, 1406, 'OSM node 1256967542'),
    ('ign-bd-topo-paiorogr0000000067334845', 46.1081488, 6.8951425, 2929, 'OSM node 1373126954'),
    ('ign-bd-topo-paiorogr0000000067334852', 46.1126645, 6.8199674, 2660, 'OSM node 1484578715'),
    ('ign-bd-topo-paiorogr0000000067334856', 46.110177, 6.7892763, 2132, 'OSM node 5121479853'),
    ('ign-bd-topo-paiorogr0000000067334858', 46.1111328, 6.7657489, 2037, 'OSM node 3064093545'),
    ('ign-bd-topo-paiorogr0000000067334929', 46.0735617, 6.8921732, 2838, 'OSM node 420260321'),
    ('ign-bd-topo-paiorogr0000000067334942', 46.0997245, 6.5516637, 1347, 'OSM node 26863737'),
    ('ign-bd-topo-paiorogr0000000067334993', 46.0476267, 6.8376824, 2775, 'OSM node 2400259043'),
    ('ign-bd-topo-paiorogr0000000067335141', 46.0306394, 6.6949471, 2120, 'OSM node 476722680'),
    ('ign-bd-topo-paiorogr0000000067335226', 46.0269548, 6.5228294, 1907, 'OSM node 5839566418'),
    ('ign-bd-topo-paiorogr0000000067335420', 45.9814762, 6.5808808, 2478, 'OSM node 1462090343'),
    ('ign-bd-topo-paiorogr0000000067335571', 45.9473407, 6.933939, 2655, 'OSM node 7944517093'),
    ('ign-bd-topo-paiorogr0000000067335910', 45.8809117, 6.8552587, 2322, 'OSM node 10944787347'),
    ('ign-bd-topo-paiorogr0000000067335970', 45.8686385, 6.9048567, 3536, 'OSM node 705002228'),
    ('ign-bd-topo-paiorogr0000000067335998', 45.8907678, 6.4523034, 1862, 'OSM node 11478926182'),
    ('ign-bd-topo-paiorogr0000000067336037', 45.8565863, 6.8885201, 4248, 'OSM node 344715573'),
    ('ign-bd-topo-paiorogr0000000067336092', 45.8439992, 6.9075331, 3792, 'OSM node 7164832044'),
    ('ign-bd-topo-paiorogr0000000067336118', 45.8522147, 6.7640685, 2299, 'OSM node 2395038951'),
    ('ign-bd-topo-paiorogr0000000067336218', 45.8523741, 5.8793254, 1025, 'OSM node 3783624865'),
    ('ign-bd-topo-paiorogr0000000067334801', 46.1323095, 6.8296979, 2662, 'OSM node 3051044139'),
    ('ign-bd-topo-paiorogr0000000067334674', 46.183122, 6.8151894, 2130, 'OSM node 3292304318'),
    ('ign-bd-topo-paiorogr0000000067335548', 45.9333714, 7.0385015, 3608, 'OSM node 12040710684'),
    ('ign-bd-topo-paiorogr0000000067336018', 45.8621023, 6.9599716, 4001, 'OSM node 340235998'),
    ('ign-bd-topo-paiorogr0000000067335461', 45.959721, 7.020211, 3901, 'OSM node 290497894'),
    ('mont-veyrier', 45.9006184, 6.1826234, 1291, 'OSM node 26863770'),
    ('le-mole', 46.1065823, 6.4548201, 1863, 'OSM node 6022119668'),
    ('aiguille-verte', 45.9345904, 6.9700185, 4121, 'OSM node 26862462'),
    ('roc-de-chere', 45.8450548, 6.2047316, 656, 'OSM node 12966527106; reviewed'),
    ('lanfonnet', 45.8502419, 6.2542903, 1795, 'OSM node 10013803883; reviewed'),
    ('mont-charvin', 45.8023466, 6.4201681, 2409, 'OSM node 510165397; reviewed'),
    ('parmelan', 45.941563, 6.245513, 1856, 'Parmelan physical high point; reviewed')
)
INSERT INTO "SummitAdminAuditLog"
  ("id", "summitId", "action", "before", "after", "createdAt")
SELECT
  'geo-canonical-20260824-' || summit."id",
  summit."id",
  'SUMMIT_UPDATED',
  jsonb_build_object(
    'altitude', summit."altitude",
    'latitude', summit."latitude",
    'longitude', summit."longitude"
  ),
  jsonb_build_object(
    'altitude', corrections."altitude",
    'latitude', corrections."latitude",
    'longitude', corrections."longitude",
    'canonicalSource', corrections."source"
  ),
  NOW()
FROM corrections
JOIN "Summit" summit ON summit."id" = corrections."summitId"
WHERE summit."latitude" IS DISTINCT FROM corrections."latitude"
   OR summit."longitude" IS DISTINCT FROM corrections."longitude"
   OR summit."altitude" IS DISTINCT FROM corrections."altitude"
ON CONFLICT ("id") DO NOTHING;

WITH corrections("summitId", "latitude", "longitude", "altitude") AS (
  VALUES
    ('cret-de-chatillon', 45.7971786, 6.1046213, 1702),
    ('pointe-percee', 45.9557596, 6.5559471, 2750),
    ('aiguille-du-midi', 45.8787035, 6.8875506, 3842),
    ('ign-bd-topo-paiorogr0000000067334345', 46.3529787, 6.7313182, 2221),
    ('ign-bd-topo-paiorogr0000000067334421', 46.3167188, 6.5318842, 1413),
    ('ign-bd-topo-paiorogr0000000067334460', 46.3077863, 6.3579817, 739),
    ('ign-bd-topo-paiorogr0000000067334555', 46.2556203, 6.4450444, 1249),
    ('ign-bd-topo-paiorogr0000000067334641', 46.2304018, 6.4961721, 1607),
    ('ign-bd-topo-paiorogr0000000067334673', 46.1815308, 6.8009439, 2346),
    ('ign-bd-topo-paiorogr0000000067334705', 46.1975701, 6.3489655, 1406),
    ('ign-bd-topo-paiorogr0000000067334845', 46.1081488, 6.8951425, 2929),
    ('ign-bd-topo-paiorogr0000000067334852', 46.1126645, 6.8199674, 2660),
    ('ign-bd-topo-paiorogr0000000067334856', 46.110177, 6.7892763, 2132),
    ('ign-bd-topo-paiorogr0000000067334858', 46.1111328, 6.7657489, 2037),
    ('ign-bd-topo-paiorogr0000000067334929', 46.0735617, 6.8921732, 2838),
    ('ign-bd-topo-paiorogr0000000067334942', 46.0997245, 6.5516637, 1347),
    ('ign-bd-topo-paiorogr0000000067334993', 46.0476267, 6.8376824, 2775),
    ('ign-bd-topo-paiorogr0000000067335141', 46.0306394, 6.6949471, 2120),
    ('ign-bd-topo-paiorogr0000000067335226', 46.0269548, 6.5228294, 1907),
    ('ign-bd-topo-paiorogr0000000067335420', 45.9814762, 6.5808808, 2478),
    ('ign-bd-topo-paiorogr0000000067335571', 45.9473407, 6.933939, 2655),
    ('ign-bd-topo-paiorogr0000000067335910', 45.8809117, 6.8552587, 2322),
    ('ign-bd-topo-paiorogr0000000067335970', 45.8686385, 6.9048567, 3536),
    ('ign-bd-topo-paiorogr0000000067335998', 45.8907678, 6.4523034, 1862),
    ('ign-bd-topo-paiorogr0000000067336037', 45.8565863, 6.8885201, 4248),
    ('ign-bd-topo-paiorogr0000000067336092', 45.8439992, 6.9075331, 3792),
    ('ign-bd-topo-paiorogr0000000067336118', 45.8522147, 6.7640685, 2299),
    ('ign-bd-topo-paiorogr0000000067336218', 45.8523741, 5.8793254, 1025),
    ('ign-bd-topo-paiorogr0000000067334801', 46.1323095, 6.8296979, 2662),
    ('ign-bd-topo-paiorogr0000000067334674', 46.183122, 6.8151894, 2130),
    ('ign-bd-topo-paiorogr0000000067335548', 45.9333714, 7.0385015, 3608),
    ('ign-bd-topo-paiorogr0000000067336018', 45.8621023, 6.9599716, 4001),
    ('ign-bd-topo-paiorogr0000000067335461', 45.959721, 7.020211, 3901),
    ('mont-veyrier', 45.9006184, 6.1826234, 1291),
    ('le-mole', 46.1065823, 6.4548201, 1863),
    ('aiguille-verte', 45.9345904, 6.9700185, 4121),
    ('roc-de-chere', 45.8450548, 6.2047316, 656),
    ('lanfonnet', 45.8502419, 6.2542903, 1795),
    ('mont-charvin', 45.8023466, 6.4201681, 2409),
    ('parmelan', 45.941563, 6.245513, 1856)
)
UPDATE "Summit" summit
SET
  "latitude" = corrections."latitude",
  "longitude" = corrections."longitude",
  "altitude" = corrections."altitude",
  "updatedAt" = NOW()
FROM corrections
WHERE summit."id" = corrections."summitId";

-- Five same-name matches remain too far away to disambiguate safely. They have
-- no user discoveries and must be reviewed instead of influencing GPS checks.
WITH review("summitId", "reason") AS (
  VALUES
    ('ign-bd-topo-paiorogr0000000067334790', 'Mont de Vouan: OSM homonym 1153 m away'),
    ('ign-bd-topo-paiorogr0000000067335791', 'Mont Lachat: OSM homonym 954 m away'),
    ('ign-bd-topo-paiorogr0000000067335799', 'Tête Noire: OSM homonym 1404 m away'),
    ('ign-bd-topo-paiorogr0000000067336286', 'Montagne d''Entrevernes: OSM peak 915 m away'),
    ('ign-bd-topo-paiorogr0000000067335953', 'Calotte de Rochefort: OSM peak 917 m away')
)
INSERT INTO "SummitAdminAuditLog"
  ("id", "summitId", "action", "before", "after", "createdAt")
SELECT
  'geo-review-20260824-' || summit."id",
  summit."id",
  'STATUS_CHANGED',
  jsonb_build_object('catalogStatus', summit."catalogStatus"),
  jsonb_build_object('catalogStatus', 'REVIEW', 'reason', review."reason"),
  NOW()
FROM review
JOIN "Summit" summit ON summit."id" = review."summitId"
WHERE summit."catalogStatus" <> 'REVIEW'
ON CONFLICT ("id") DO NOTHING;

UPDATE "Summit"
SET "catalogStatus" = 'REVIEW', "updatedAt" = NOW()
WHERE "id" IN (
  'ign-bd-topo-paiorogr0000000067334790',
  'ign-bd-topo-paiorogr0000000067335791',
  'ign-bd-topo-paiorogr0000000067335799',
  'ign-bd-topo-paiorogr0000000067336286',
  'ign-bd-topo-paiorogr0000000067335953'
);

-- The account owner confirmed that this activity stopped at the foot of the
-- Dents de Lanfon. It must not retain the historical Lanfonnet false positive.
UPDATE "SummitDiscovery" discovery
SET
  "status" = 'DISMISSED',
  "confirmationSource" = NULL,
  "confirmedAt" = NULL,
  "dismissedAt" = NOW()
FROM "Activity" activity
WHERE discovery."activityId" = activity."id"
  AND discovery."summitId" = 'lanfonnet'
  AND activity."title" ILIKE '%Pieds Dent de Lanfon%';
