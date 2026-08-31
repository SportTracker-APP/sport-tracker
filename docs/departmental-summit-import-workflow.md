# Catalogue sommets — workflow départemental standard

Ce runbook est le contrat unique pour chaque nouveau département. Il reprend le
pipeline validé en Haute-Savoie sans assouplir ses protections. Un département
doit d'abord être inscrit explicitement dans la liste blanche
`summit-department-import.ts`. La présence d'un snapshot ne suffit jamais à
autoriser un import.

## Chaîne de livraison obligatoire

```text
Snapshot source
→ checksum vérifié sur l'archive
→ dry-run
→ classification CORE / SECONDARY / REFERENCE
→ analyse humaine des conflits
→ backup / branche de restauration production
→ prepare
→ preview
→ apply CORE confirmé
→ curation des conflits
→ publication complémentaire
→ QA DB stricte
→ QA publique
→ QA géographique IGN / OSM / relief 3D
```

Les archives IGN, leurs extractions, les snapshots OSM, les caches et les
rapports contenant des données brutes restent hors Git.

## 1. Source immuable et checksum

Conserver l'archive IGN originale et son checksum publié. La commande calcule
réellement le MD5 (32 caractères) ou le SHA-256 (64 caractères) de l'archive :
un checksum seulement recopié dans un argument n'est plus considéré comme une
preuve.

Variables utilisées dans les exemples :

```bash
DEPARTMENT=74
SOURCE_VERSION=2026-06-15
SOURCE_ARCHIVE=/chemin/BDTOPO_D074_2026-06-15.7z
SOURCE_CHECKSUM=efa8b87b3751e737d90895e494f875f7
SNAPSHOT_DIR=/chemin/BDT_3-5_SHP_LAMB93_D074_ED2026-06-15
OSM_SNAPSHOT=/chemin/osm-haute-savoie-peaks.json
CACHE_DIR=/tmp/hovren-bdtopo-altitude-cache
```

## 2. Dry-run et classification

Le dry-run n'écrit aucun `Summit` :

```bash
pnpm summits:import -- \
  --dry-run \
  --department="$DEPARTMENT" \
  --catalog=database \
  --source-version="$SOURCE_VERSION" \
  --source-archive="$SOURCE_ARCHIVE" \
  --source-checksum="$SOURCE_CHECKSUM" \
  --snapshot-dir="$SNAPSHOT_DIR" \
  --osm-snapshot="$OSM_SNAPSHOT" \
  --cache-dir="$CACHE_DIR" \
  --report=/tmp/hovren-d074-dry-run.json
```

Le rapport doit être archivé avec la release. Vérifier les totaux source,
candidats, tiers, créations prévues, matches, conflits, rejets, altitudes,
coordonnées, massifs, homonymes et `unexplainedGaps`. Tout écart inexpliqué
vaut STOP.

## 3. Analyse des conflits

Les conflits sont traités dans le back-office. Les seules décisions autorisées
sont `MATCH_EXISTING`, `CREATE_NEW`, `IGNORE` ou `KEEP_FOR_REVIEW`. Le nom seul
ne permet jamais une fusion. Un conflit non résolu reste exclu du lot sûr.

## 4. Backup production

Avant `prepare`, créer dans Neon un point de restauration ou une branche de la
base production et noter son identifiant dans le journal de release. Vérifier
la base, l'hôte et la date du backup. Cette étape dépend du fournisseur et ne
doit pas être simulée par le script applicatif.

## 5. Prepare

Sur une base distante, les trois confirmations restent obligatoires : token de
release exact, hôte exact et nom de base exact.

```bash
pnpm summits:import -- \
  --prepare \
  --department=74 \
  --source-version=2026-06-15 \
  --source-archive="$SOURCE_ARCHIVE" \
  --source-checksum="$SOURCE_CHECKSUM" \
  --snapshot-dir="$SNAPSHOT_DIR" \
  --osm-snapshot="$OSM_SNAPSHOT" \
  --cache-dir="$CACHE_DIR" \
  --catalog=database \
  --confirm-production=HAUTE-SAVOIE-CORE-2026-06-15 \
  --expected-db-host=<hôte-vérifié> \
  --expected-db-name=<base-vérifiée> \
  --report=/tmp/hovren-d074-prepare.json
```

Le `PREPARE` est idempotent par `provider/sourceVersion/scope`. Une même
version avec un checksum différent est refusée.

## 6. Preview puis apply

Le preview relit le run réellement stocké et vérifie le département et la
version annoncés :

```bash
pnpm summits:import -- \
  --preview-apply \
  --department=74 \
  --source-version=2026-06-15 \
  --import-run=<id> \
  --confirm-production=HAUTE-SAVOIE-CORE-2026-06-15 \
  --expected-db-host=<hôte-vérifié> \
  --expected-db-name=<base-vérifiée>
```

Comparer le preview au dry-run approuvé. Si les compteurs diffèrent sans raison
documentée : STOP. L'apply ajoute encore une confirmation dédiée :

```bash
pnpm summits:import -- \
  --apply \
  --confirm-core-release \
  --department=74 \
  --source-version=2026-06-15 \
  --import-run=<id> \
  --confirm-production=HAUTE-SAVOIE-CORE-2026-06-15 \
  --expected-db-host=<hôte-vérifié> \
  --expected-db-name=<base-vérifiée>
```

Seuls les candidats CORE complets et éligibles sont appliqués. Les conflits
ouverts, SECONDARY et REFERENCE ne sont jamais publiés par ce lot.

## 7. Curation et publication complémentaire

Après publication initiale, les décisions admin sont appliquées via
`POST /admin/summits/import-runs/:id/publish-resolutions`. Ce workflow est
transactionnel, audité et idempotent. Il ne remet jamais artificiellement le
run en `PREPARED`.

## 8. QA DB automatique

```bash
pnpm summits:qa:import -- \
  --import-run=<id> \
  --strict \
  --report=/tmp/hovren-d074-post-import-qa.json
```

Le rapport contient automatiquement : total candidats, CORE, SECONDARY,
REFERENCE, créations, matches, conflits historiques et ouverts, rejets,
candidats sans altitude ou coordonnées, sommets sans massif, homonymes, écarts
inexpliqués et nombre final réellement publié. `--strict` retourne un échec si
un contrôle structurel est rouge.

## 9. QA publique et géographique

Après une QA DB verte :

1. vérifier `/sommets`, Exploration, recherche et `/admin/sommets` ;
2. rechercher plusieurs nouveaux sommets et plusieurs legacy ;
3. confirmer qu'un sommet masqué ou REFERENCE est absent du public ;
4. comparer un échantillon IGN/OSM et le relief 3D :

```bash
pnpm summits:qa:osm -- \
  --department=74 \
  --source-version=2026-06-15 \
  --snapshot-dir="$SNAPSHOT_DIR" \
  --osm-snapshot="$OSM_SNAPSHOT" \
  --report=/tmp/hovren-d074-osm-qa.json
```

Un offset graphique arbitraire n'est jamais une correction géographique.

## Jalon « 74 stabilisé » avant Savoie

La Savoie (`D073`) est volontairement présente mais désactivée dans la liste
blanche. Les analyses sans écriture (`dry-run` et QA OSM) restent possibles,
mais `prepare`, preview d'application, apply et publication complémentaire sont
bloqués tant que ce jalon n'est pas validé.

| Critère                      | État au 31 août 2026         | Preuve attendue                         |
| ---------------------------- | ---------------------------- | --------------------------------------- |
| Publication post-conflits    | Implémentée                  | tests service + essai admin idempotent  |
| Validation GPS terrain       | À valider                    | vraie sortie du Vélan synchronisée      |
| Audit géographique           | À finaliser                  | rapport IGN/OSM + échantillon relief 3D |
| Compteurs et progressions    | Implémentés, QA prod requise | rapport `summits:qa:import` vert        |
| Date de découverte           | Implémentée                  | date activité conservée après sync      |
| Difficulté retirée des cards | Validé                       | liste publique sans `À définir`         |
| Photo admin                  | Opérationnelle               | upload/remplacement/fallback vérifiés   |
| Procédure reproductible      | Validée par ce document      | dry-run complet d'un dataset de test    |

Verdict actuel : **NO GO Savoie**, uniquement à cause des validations terrain et
géographiques encore attendues. Ce verrou doit être levé par une modification
explicite et revue de la liste blanche.
