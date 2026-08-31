# Catalogue Haute-Savoie V1 — contrat d’import

> Ce document conserve le contrat de données historique de la release D074.
> Les commandes ci-dessous ne sont plus la procédure opératoire de référence.
> Utiliser exclusivement
> [`departmental-summit-import-workflow.md`](./departmental-summit-import-workflow.md),
> qui impose désormais le département explicite, la vérification réelle de
> l'archive source et la QA post-import consolidée.

## Référentiel de production

- Producteur : Institut national de l’information géographique et forestière
  (IGN).
- Jeu : BD TOPO® 3.5, tous thèmes, SHP Lambert-93, département 074.
- Édition : `2026-06-15`.
- Identifiant de livraison :
  `IGNF_BDTOPO_3-5_SHP_LAMB93_D074-ED2026-06-15`.
- Archive :
  `BDTOPO_3-5_TOUSTHEMES_SHP_LAMB93_D074_2026-06-15.7z`.
- MD5 vérifié : `efa8b87b3751e737d90895e494f875f7`.
- Couche : `LIEUX_NOMMES/DETAIL_OROGRAPHIQUE`, complétée par
  `LIEUX_NOMMES/TOPONYMIE` et le contour officiel
  `ADMINISTRATIF/DEPARTEMENT`.
- Licence : Licence Ouverte / Open Licence Etalab 2.0.

L’archive source et son extraction ne sont jamais versionnées dans Git. IGN
est une source d’ingestion hors ligne : aucune page HOVREN n’appelle IGN au
runtime.

## Définition V1 d’un sommet

La whitelist est strictement limitée aux valeurs BD TOPO suivantes :

```text
Sommet
Pic
```

`Montagne` est exclu : la documentation BD TOPO le définit comme un ensemble
ou relief global, pas nécessairement comme un point sommital. Les cols,
passages, crêtes, rochers, vallées, plateaux, falaises et lieux-dits restent
également hors contrat, indépendamment de leur nom ou altitude.

Aucun seuil d’altitude, de popularité ou de fréquentation n’est appliqué. Les
coordonnées Lambert-93 sont converties en WGS84. L’altitude, absente de la
couche source, est enrichie une fois pendant l’import via le calcul
altimétrique IGN (`ign_rge_alti_wld`), par lots de 5 000 maximum, avec timeout,
retries bornés et cache local gitignoré.

## Périmètre administratif

Le candidat doit être à l’intérieur du polygone officiel de Haute-Savoie. Un
point situé à l’extérieur mais à une distance inférieure ou égale à la
précision planimétrique déclarée par sa feature reste candidat frontalier et
part obligatoirement en conflit. Il n’est ni exclu ni publié silencieusement.

La hiérarchie administrative est :

```text
France
└── Auvergne-Rhône-Alpes
    └── Haute-Savoie
```

Les nouveaux sommets reçoivent ces associations administratives. Aucun massif
n’est déduit depuis le nom : tant que la taxonomie fiable manque, le massif
principal reste à vérifier.

## Déduplication

L’ordre de décision est centralisé :

1. référence unique `(provider, externalId)` : match certain ;
2. legacy sans référence : nom normalisé ou alias + distance maximale de
   400 m + écart d’altitude maximal de 80 m : match ;
3. même nom jusqu’à 1 500 m mais position ou altitude non concordante :
   conflit ;
4. sommet historique très proche avec un nom différent : conflit ;
5. aucun doublon plausible : candidat prêt pour le staging.

Le nom seul ne déclenche jamais une fusion. Les seuils sont déclarés dans
`summit-import.constants.ts` et couverts par tests.

## Commandes sûres

Le dry-run est le comportement par défaut et ne contacte pas la base lorsque
le catalogue bootstrap est choisi :

```bash
npm run summits:import -- \
  --dry-run \
  --catalog=bootstrap \
  --snapshot-dir=/chemin/vers/BDT_3-5_SHP_LAMB93_D074_ED2026-06-15 \
  --osm-snapshot=/chemin/vers/osm-haute-savoie-peaks.json \
  --source-version=2026-06-15 \
  --source-checksum=efa8b87b3751e737d90895e494f875f7 \
  --cache-dir=/tmp/hovren-bdtopo-altitude-cache \
  --report=/tmp/hovren-haute-savoie-dry-run.json
```

Le sas administrable se prépare ensuite uniquement sur une base locale/test :

```bash
DATABASE_URL=postgresql://...@127.0.0.1:5432/hovren_test \
npm run summits:import -- \
  --prepare \
  --confirm-local-test \
  --catalog=database \
  --snapshot-dir=/chemin/vers/BDT_3-5_SHP_LAMB93_D074_ED2026-06-15 \
  --osm-snapshot=/chemin/vers/osm-haute-savoie-peaks.json \
  --source-version=2026-06-15 \
  --source-checksum=efa8b87b3751e737d90895e494f875f7 \
  --cache-dir=/tmp/hovren-bdtopo-altitude-cache \
  --report=/tmp/hovren-haute-savoie-prepare.json
```

`PREPARE` crée un seul `SummitImportRun` par triplet
`provider/sourceVersion/scope`, persiste les candidats et leurs signaux, mais
ne crée aucun `Summit`. Une seconde exécution identique réutilise le run. Un
checksum différent pour la même version est refusé.

Après résolution humaine de tous les conflits bloquants, l’application locale
se lance explicitement avec :

```bash
DATABASE_URL=postgresql://...@127.0.0.1:5432/hovren_test \
npm run summits:import -- \
  --apply \
  --confirm-local-test \
  --import-run=<id-du-run>
```

`--prepare` et `--apply` bloquent toute URL dont l’hôte n’est pas `localhost`,
`127.0.0.1` ou `::1`. L’apply refuse les conflits ouverts, conserve les
`REFERENCE` au stade candidat, et crée les nouveaux `CORE`/`SECONDARY` masqués
et `À vérifier`. Importer ne publie jamais automatiquement.

## QA OpenStreetMap

OpenStreetMap est uniquement un contre-référentiel. La requête
`natural=peak` est conservée hors Git puis comparée spatialement et par nom au
snapshot IGN. Aucun objet OSM n’est ajouté au catalogue. Le rapport porte
l’attribution `© OpenStreetMap contributors — ODbL 1.0` et sépare les éléments
sans match pour revue humaine.

## Territoires d’aventure

Les choix utilisent exclusivement `UserGeoAreaPreference` de type
`DISCOVERY`. Plusieurs zones forment une union. Choisir le département ne
duplique pas tous ses massifs enfants. Une sélection vide signifie « tout
HOVREN ». Ces préférences définissent le scope initial d’Exploration et de la
page Sommets, jamais les droits d’accès ni les liens directs.

L’onboarding est suivi par `UserOnboardingState` avec la clé
`discovery-areas`, version `1`. Les départements et massifs proposés, ainsi que
leurs compteurs, proviennent des données publiques du backend.
