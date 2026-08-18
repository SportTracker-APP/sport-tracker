# Haute-Savoie — industrialisation du catalogue sommets

Date de recette : 18 août 2026.

## Décision

La Phase 8.6 est prête localement jusqu’au **STOP GATE 3**. Aucun apply n’a été
effectué : les 65 conflits restent volontairement bloquants. Aucun accès à
Neon, aucune écriture en production, aucune publication et aucun déploiement
n’ont été réalisés.

## Tiers produit

Le modèle distingue désormais trois dimensions indépendantes :

- `catalogTier` : rôle produit final (`CORE`, `SECONDARY`, `REFERENCE`) ;
- `suggestedTier` et `tierReason` : proposition explicable du pipeline ;
- `catalogStatus` et `isActive` : qualité éditoriale et publication.

La classification est centralisée dans `summit-catalog-tier.ts`. Elle applique
strictement le scénario B : legacy certain, importance IGN, correspondance OSM,
distance au candidat supérieur et proéminence déclarée lorsqu’elle existe. Une
proéminence fiable inférieure à 30 m empêche `CORE`, hors protection legacy.

Résultat reproductible sur les 911 candidats :

| Tier proposé | Résultat | Référence Phase 8.5 | Écart |
| ------------ | -------: | ------------------: | ----: |
| `CORE`       |      256 |                 256 |     0 |
| `SECONDARY`  |      280 |                 280 |     0 |
| `REFERENCE`  |      375 |                 375 |     0 |

Les 24 sommets historiques sont initialisés en `CORE` et ne sont jamais
dégradés automatiquement.

## Staging et STOP GATE 1

Le pipeline possède trois modes séparés :

- `DRY-RUN` : analyse et rapport, zéro accès nécessaire à la base avec le
  catalogue bootstrap ;
- `PREPARE` : un run et ses candidats, aucun nouveau `Summit` ;
- `APPLY` : base locale/test uniquement, après résolution des conflits.

Recette PostgreSQL 16 isolée :

| Mesure                                  |         Valeur |
| --------------------------------------- | -------------: |
| ImportRun                               | 1 (`PREPARED`) |
| Candidats persistés                     |            911 |
| CORE proposés                           |            256 |
| SECONDARY proposés                      |            280 |
| REFERENCE                               |            375 |
| Matchs legacy certains                  |             10 |
| Conflits bloquants                      |             65 |
| Groupes homonymes                       |             25 |
| Candidats homonymes                     |             53 |
| Nouveaux candidats sans massif fiable   |            836 |
| Massifs attribués automatiquement       |              0 |
| Massifs à vérifier après un futur apply |            836 |

Le second `PREPARE` a renvoyé le même identifiant de run avec
`idempotent: true`. La base contenait toujours 1 run, 911 candidats et les 24
sommets historiques. La tentative d’`APPLY` a été refusée avec le message
`65 conflit(s) bloquant(s) non résolu(s)` ; aucun sommet n’a été créé.

Les 375 `REFERENCE` restent volontairement des candidats internes lors de
l’apply. Ils conservent provenance et signaux sans polluer la table `Summit`.

## Administration

La zone Imports de `/admin/sommets` fournit :

- compteurs par tier, conflits résolus/non résolus, legacy, homonymes et
  absence de massif ;
- filtres Tous, tier final, Conflits, Legacy, Sans massif, Résolus et Homonymes ;
- détail des signaux IGN/OSM, coordonnées, altitude, distance au sommet
  supérieur, proéminence disponible, tier suggéré/final et match HOVREN ;
- décisions `MATCH_EXISTING`, `CREATE_NEW`, `IGNORE` avec raison obligatoire,
  et `KEEP_FOR_REVIEW` ;
- override de tier audité sur les sommets, avec confirmation de l’impact
  produit. Passer en `REFERENCE` masque automatiquement le sommet.

Les mutations restent protégées par le rôle `ADMIN`. Les invalidations React
Query existantes rafraîchissent listes, détail, compteurs et carte après une
mutation admin.

## STOP GATE 2 — massifs

### Sources auditées

- géométries et `GeoArea` déjà présentes dans le dépôt ;
- livraison IGN BD TOPO D074 utilisée pour les sommets et limites
  administratives ;
- instantané OSM utilisé uniquement comme contre-référentiel ponctuel ;
- documentation et fichiers des phases 8/8.5.

### Pourquoi elles sont insuffisantes

Aucune de ces sources ne fournit un découpage polygonal homogène, officiel et
réutilisable des massifs éditoriaux HOVREN (Mont-Blanc, Aravis, Bornes,
Chablais, Bauges périphériques). Les `GeoArea MASSIF` historiques ont des noms
et une hiérarchie, mais pas de limites fiables. Déduire un massif par nom,
voisinage, rectangle ou polygone dessiné à la main serait non reproductible.

### Recommandation

Ouvrir un chantier séparé de référentiel de limites de massifs : sélectionner
une source licenciée et documentée, conserver sa version et sa provenance,
puis proposer une géométrie optionnelle générique sur `GeoArea`. Une
intersection point-in-polygon hors ligne suffit d’abord ; PostGIS ne devient
utile qu’à plus grande échelle. Les intersections multiples ou absentes
doivent rester `null / NEEDS_REVIEW`.

### Coût et impact

Complexité estimée : moyenne, dominée par la sélection/licence, la
normalisation des limites et la recette humaine. Ce manque ne bloque pas le
staging ni la résolution des conflits, mais maintient les 836 nouveaux
candidats en `À vérifier` et non publiés. Aucune attribution n’a été inventée.

## Produit public

- `CORE` : catalogue principal, Exploration, recherche, découverte automatique,
  carnet et progression ;
- `SECONDARY` : carte/recherche explicites uniquement, visible 1,8 niveau de
  zoom plus près, sans découverte, numéro de carnet ni progression ;
- `REFERENCE` : jamais envoyé aux API publiques standard.

La page Sommets et les compteurs principaux filtrent explicitement `CORE`. Le
backend de découverte applique également ce filtre : une trace proche de 1
CORE, 3 SECONDARY et 4 REFERENCE produit exactement une seule découverte.

## Performance locale

| Mesure                                           | Résultat |
| ------------------------------------------------ | -------: |
| Stockage `SummitImportCandidate` (table + index) | 1 320 kB |
| Stockage `SummitImportRun` (table + index)       |    80 kB |
| Filtre admin Conflits, 50 résultats              |  0,06 ms |
| Filtre admin CORE, 50 résultats                  |  0,39 ms |
| Filtre admin Homonymes, 50 résultats             |  0,07 ms |

Les index composites du run, du tier, du statut et des homonymes sont inclus
dans la migration finale. Les performances carte/API après apply ne sont pas
mesurées, car le STOP GATE 3 interdit encore l’apply. Le payload public reste
donc celui des 24 sommets historiques.

## Risques ouverts

1. Les 65 conflits exigent une décision humaine avant apply.
2. Les 836 nouveaux candidats n’ont pas de massif principal fiable et restent
   non publiables selon la règle de qualité actuelle.
3. Les 14 legacy sans référence IGN certaine nécessitent une revue éditoriale,
   sans dégradation automatique.
4. Les chiffres de performance après apply restent à mesurer seulement après
   levée explicite du STOP GATE 3.

## Checklist manuelle avant le prochain feu vert

- [ ] Ouvrir l’import Haute-Savoie et retrouver 256 / 280 / 375.
- [ ] Tester les filtres CORE, SECONDARY, REFERENCE et leur pagination.
- [ ] Ouvrir une fiche de chacun des trois tiers et vérifier les signaux.
- [ ] Modifier un tier en admin, confirmer l’impact et vérifier l’audit.
- [ ] Traiter un conflit legacy puis un conflit frontalier.
- [ ] Vérifier un groupe homonyme avec coordonnées, altitude et identifiant IGN.
- [ ] Confirmer qu’un candidat sans massif reste sans affectation inventée.
- [ ] Reporter l’attribution massif jusqu’à une source polygonale fiable.
- [ ] Vérifier CORE dans Exploration au zoom courant.
- [ ] Vérifier SECONDARY au zoom rapproché et sans numéro de carnet.
- [ ] Vérifier qu’un REFERENCE est absent de la carte et de la recherche publique.
- [ ] Confirmer une découverte CORE et l’absence de découverte SECONDARY.
- [ ] Vérifier que la progression et le dénominateur comptent seulement CORE.
- [ ] Refaire les contrôles admin et Exploration sur mobile.
- [ ] Ne lancer l’apply local/test qu’après zéro conflit bloquant.
