# Haute-Savoie — calibration du catalogue sommets HOVREN

Date de l'analyse : 17 août 2026.

## Décision immédiate

**STOP GATE maintenu.** Aucun `--apply`, aucun staging massif, aucune migration,
aucune publication et aucune écriture en base n'ont été exécutés pendant cette
calibration.

Le dry-run prouve l'exhaustivité du référentiel géographique, pas la pertinence
de 846 sommets publics. La recommandation provisoire est le **scénario B** :

| Tier proposé sur les 911 candidats IGN | Nombre | Densité / 100 km² |
| --- | ---: | ---: |
| `CORE` | **256** | 5,6 |
| `SECONDARY` | **280** | 6,1 |
| `REFERENCE` | **375** | 8,2 |

Ces nombres sont des propositions de tier, pas des autorisations de
publication. Les 65 conflits du pipeline restent en revue, quel que soit leur
tier proposé.

## Réponse courte à la question produit

Un sommet mérite d'être `CORE` lorsqu'il combine une reconnaissance
cartographique forte, une identité géographique suffisamment indépendante et,
le cas échéant, une validation éditoriale HOVREN. L'altitude seule ne décide
rien.

La donnée disponible permet déjà une première sélection explicable grâce au
champ officiel IGN `IMPORTANCE`. Elle ne permet pas encore une décision finale
universelle : la proéminence n'est renseignée de façon exploitable que pour 10
candidats sur 911 et la distance au sommet plus élevé n'est pas une
proéminence.

## Sources et périmètre audités

| Source | Version / empreinte | Usage |
| --- | --- | --- |
| IGN BD TOPO® 3.5, Détail orographique, D074 | édition 2026-06-15, MD5 `efa8b87b3751e737d90895e494f875f7` | référentiel principal |
| Cache altimétrique IGN RGE ALTI | SHA-256 `fbfe398ca003baa044b3fa2f7aaf2abc93bf2e3d3346fa3563af98f1c78046da` | altitude ponctuelle des 911 candidats |
| Snapshot OSM `natural=peak`, FR-74 | SHA-256 `9e1702ba941f601ccb48c2b85223bcf236fb7f65d4e942f9bb5a827e9ae1a4d2` | contre-référentiel, Wikidata/Wikipedia et proéminence déclarée |
| Catalogue HOVREN historique | 24 sommets | benchmark et règle de préservation |

Le polygone départemental D074 du snapshot représente environ **4 597 km²**.
Cette aire géométrique est utilisée uniquement pour rendre les densités des
scénarios comparables.

Références de documentation :

- [descriptif de contenu BD TOPO® 3.5 de l'IGN](https://geoservices.ign.fr/sites/default/files/2025-12/DC_BDTOPO_3-5.pdf) ;
- [suivi des évolutions RGE ALTI® de l'IGN](https://geoservices.ign.fr/sites/default/files/2021-07/SE_RGEALTI.pdf) ;
- [documentation officielle Copernicus DEM](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM).

## Dataset brut

| Mesure | Nombre |
| --- | ---: |
| Features IGN examinées | 2 849 |
| Candidats IGN `Sommet` / `Pic` dans le périmètre | **911** |
| Importables selon le pipeline Phase 8 | 846 |
| Matchs certains avec le catalogue historique | 10 |
| Nouveaux candidats complets | 836 |
| Conflits | 65 |
| Rejetés avant calibration | 1 938 |

Les 65 conflits se décomposent en 61 points frontaliers et 4 rapprochements
legacy ambigus. Ils ne sont pas masqués par la classification de tier.

## Disponibilité réelle des signaux

| Signal | Disponibilité | Conclusion |
| --- | ---: | --- |
| Nom | 911 / 911 | complet |
| Altitude ponctuelle RGE ALTI | 911 / 911 | complet, mais pas une proéminence |
| Coordonnées | 911 / 911 | complet |
| Nature IGN | 911 / 911 | 612 `Sommet`, 299 `Pic` |
| Nature détaillée IGN | 0 / 911 | champ absent sur ce snapshot |
| Identifiant IGN | 911 / 911 | stable pour la provenance |
| Importance cartographique IGN | 911 / 911 | signal officiel exploitable |
| Statut du toponyme | 911 / 911 | 905 `Validé`, 6 `Collecté` |
| Code commune calculé | 871 / 911 | utile pour la QA territoriale |
| Département | 911 / 911 | D074, dont 61 à revoir en frontière |
| Massif éditorial fiable | 24 legacy ; 836 nouveaux sans massif, conflits à part | insuffisant pour automatiser le tier |
| Correspondance OSM unique côté IGN | 633 / 911 | signal complémentaire |
| Wikidata via le point OSM apparié | 420 / 911 | signal de reconnaissance, pas de popularité |
| Wikipedia via le point OSM apparié | 157 / 911 | signal de reconnaissance, pas un critère suffisant |
| Proéminence OSM déclarée et appariée | 10 / 911 | trop lacunaire |
| Proéminence avec une expression de source taguée et appariée | 4 / 911 | encore insuffisant et non validé uniformément |

Le rapport OSM Phase 8 comptait 548 correspondances par nom et 88 par position
du point de vue des 958 objets OSM. La présente analyse, orientée candidats IGN,
obtient 547 correspondances par nom et 86 par position, soit **633 candidats
IGN uniques**. La différence est attendue : plusieurs objets OSM peuvent viser
le même candidat IGN.

## Le signal officiel IGN `IMPORTANCE`

La documentation IGN décrit ce champ comme une hiérarchie d'importance ou de
notoriété relative telle que représentée sur la carte topographique :

| Valeur | Rayonnement cartographique | Candidats | Appariés OSM |
| --- | --- | ---: | ---: |
| 1 | national, ordre du 1:1 000 000 | 3 | 2 |
| 2 | régional, ordre du 1:250 000 | 89 | 73 |
| 3 | départemental, ordre du 1:100 000 | 303 | 257 |
| 4 | intercommunal/cantonal, ordre du 1:50 000 | 280 | 196 |
| 5 | communal, ordre du 1:25 000 | 229 | 105 |
| 6 | local, ordre du 1:5 000 | 7 | 0 |

Ce champ est le meilleur signal de départ disponible : il est officiel,
national, stable et indépendant de l'altitude. Il ne représente toutefois ni
la proéminence ni l'intérêt de randonnée. Un override éditorial reste donc
obligatoire.

## Distribution d'altitude

L'altitude décrit le jeu de données, mais ne participe pas directement aux
règles de tier.

| Intervalle | Candidats |
| --- | ---: |
| moins de 1 000 m | 78 |
| 1 000 à 1 499 m | 72 |
| 1 500 à 1 999 m | 253 |
| 2 000 à 2 499 m | 206 |
| 2 500 à 2 999 m | 109 |
| 3 000 m et plus | 193 |

Minimum : 412 m ; médiane : 2 140 m ; moyenne : 2 257 m ; maximum mesuré par
le cache : 4 765 m.

Deux contre-exemples confirment que l'altitude ne doit pas décider :

- le Petit Salève, 696 m et importance IGN 2, reste un candidat `CORE` dans le
  scénario équilibré ;
- la Dent du Crocodile, 3 541 m, importance 5 et à 170 m d'un sommet plus
  élevé, est proposée `REFERENCE`.

## Distance au sommet plus élevé le plus proche

La mesure compare chaque candidat aux 910 autres candidats IGN. Elle indique
la densité d'une crête, mais ne calcule ni col clé ni proéminence.

| Sommet plus élevé situé à… | Candidats concernés |
| --- | ---: |
| moins de 50 m | 0 |
| moins ou égal à 100 m | 11 |
| moins ou égal à 250 m | 83 |
| moins ou égal à 500 m | 232 |
| moins ou égal à 1 km | 488 |

Distribution : minimum 57 m, premier quartile 497 m, médiane 914 m, troisième
quartile 1 719 m, neuvième décile 3 105 m. Le candidat le plus élevé n'a, par
définition, aucun candidat supérieur dans le périmètre.

Cette mesure produit des signaux utiles, mais parfois contradictoires avec la
topographie réelle. Le Roc d'Enfer a un candidat supérieur à 381 m alors que sa
proéminence OSM déclarée est de 1 080 m : la proximité d'un point plus élevé
ne suffit donc pas à le classer secondaire.

## Micro-sommets et clusters

| Mesure | 250 m | 500 m | 1 km |
| --- | ---: | ---: | ---: |
| Candidats ayant au moins un voisin | 139 | 373 | 676 |
| Composantes comportant au moins 2 candidats | 52 | 123 | — |
| Composantes comportant au moins 3 candidats | 15 | 44 | — |
| Composantes comportant au moins 5 candidats | 5 | 16 | — |
| Taille du plus grand cluster | 9 | 23 | — |

Exemples particulièrement parlants :

- Aiguille du Plan / Blaitière : 9 candidats dans une composante à 250 m ;
- Grands Charmoz / Grépon : 6 candidats à 250 m ;
- Grandes Jorasses : 6 pointes à 250 m, de Walker à Young ;
- Mont Blanc du Tacul / Grand Capucin : 12 candidats dans une composante à
  500 m ;
- Plan / Blaitière / Charmoz : 23 candidats dans une composante à 500 m.

Le cas des Grandes Jorasses illustre le comportement recherché : Pointe Walker
peut être `CORE`, tandis que Whymper, Croz, Hélène, Marguerite et Young doivent
être proposées `SECONDARY` ou `REFERENCE` selon les signaux complémentaires.

## Audit de la proéminence

### Disponibilité

- 11 points sur les 958 objets OSM portent un tag `prominence` ;
- 10 valeurs ont pu être appariées de façon conservatrice à un candidat IGN ;
- 5 points OSM seulement portent aussi une expression `source:prominence` ;
- 4 de ces points ont été appariés automatiquement à un candidat IGN ;
- aucune série homogène et validée ne couvre les 911 candidats.

Réponse stricte : **proéminence uniformément fiable disponible : 0 / 911**.
Réponse descriptive : **10 / 911 valeurs déclarées**, dont **4 / 911 avec une
provenance textuelle taguée**. Elles servent à tester les règles et à détecter
des contre-exemples, jamais à remplir les 901 valeurs manquantes.

### Simulation exploratoire sur les 10 seules valeurs appariées

| Seuil | Candidats mesurés conservés | Legacy mesurés conservés | Densité / 100 km² | Benchmark notable exclu |
| --- | ---: | ---: | ---: | --- |
| ≥ 20 m | 9 / 10 | 5 / 5 | 0,20 | Mont Blanc de Courmayeur, 17 m |
| ≥ 30 m | 9 / 10 | 5 / 5 | 0,20 | Mont Blanc de Courmayeur |
| ≥ 50 m | 9 / 10 | 5 / 5 | 0,20 | Mont Blanc de Courmayeur |
| ≥ 75 m | 9 / 10 | 5 / 5 | 0,20 | Mont Blanc de Courmayeur |
| ≥ 100 m | 9 / 10 | 5 / 5 | 0,20 | Mont Blanc de Courmayeur |
| ≥ 150 m | 9 / 10 | 5 / 5 | 0,20 | Mont Blanc de Courmayeur |
| ≥ 200 m | 7 / 10 | 4 / 5 | 0,15 | Le Brévent, Pointe Kurz, Mont Blanc de Courmayeur |

Cette table ne permet pas de choisir un seuil départemental. Elle montre
seulement qu'une proéminence faible peut corriger un faux positif : malgré son
importance IGN 2, le Mont Blanc de Courmayeur est logiquement secondaire par
rapport au Mont Blanc.

## Faisabilité d'un calcul DEM correct

### Source française

Le RGE ALTI® est un modèle numérique de terrain IGN disponible aux pas de 1 m
et 5 m. Le service ponctuel déjà utilisé par HOVREN ne suffit pas : une
proéminence exige la surface continue, l'identification du col clé et la
recherche d'un sommet supérieur connecté.

Ordres de grandeur sur 4 597 km², avant buffer :

| Pas | Cellules approximatives | Volume brut float32 | Conclusion |
| --- | ---: | ---: | --- |
| 1 m | 4,6 milliards | 18,4 Go | trop lourd pour une première calibration |
| 5 m | 184 millions | 0,74 Go | faisable en batch, plusieurs Go avec les structures de calcul |

### Source transfrontalière

Le département comporte 61 candidats frontaliers. Un calcul arrêté à la
frontière française donnerait des cols clés faux. Copernicus GLO-30 couvre le
monde à 30 m, mais il s'agit d'un modèle de surface, moins précis pour les
sommets boisés et les micro-reliefs. Il constitue un bon candidat pour un
premier calcul transfrontalier reproductible, à contrôler ensuite avec RGE
ALTI 5 m sur l'intérieur français.

### Méthode à étudier dans un chantier distinct

1. assembler un raster continu avec un buffer suffisant autour de D074 ;
2. corriger les `nodata` et harmoniser référence verticale et projection ;
3. associer chaque candidat au maximum raster local pertinent ;
4. construire la hiérarchie des bassins par traitement décroissant des
   altitudes, de type union-find/watershed ;
5. déterminer le col clé reliant chaque sommet à un sommet supérieur ;
6. calculer `altitude sommet - altitude col clé` ;
7. valider sur les valeurs OSM sourcées et un échantillon humain ;
8. conserver source, version, résolution et date du calcul.

Complexité : chantier géospatial moyen à élevé. Il doit être séparé du modèle
de données produit et ne doit pas être improvisé dans le pipeline d'import.

## Règle de classification proposée

Les scénarios utilisent uniquement des signaux explicables :

1. `legacy` : override de préservation HOVREN ;
2. `IMPORTANCE` IGN : reconnaissance cartographique officielle ;
3. appariement OSM : reconnaissance indépendante ;
4. distance au candidat plus élevé : signal de densité, jamais pseudo-
   proéminence ;
5. proéminence déclarée inférieure à 30 m : veto provisoire de `CORE`, sauf
   override legacy ;
6. décision admin future : override final avec audit.

La présence dans Wikidata ou Wikipedia renforce la confiance de
reconnaissance, mais n'ajoute pas seule un tier : cela éviterait de recréer un
score de popularité.

## Scénarios

Les nombres ci-dessous classent les **911 candidats IGN** et totalisent
toujours 911. Les 14 sommets legacy non absorbés par un match certain (4
conflits et 10 sans lien candidat sûr) restent des objets `CORE`
supplémentaires dans le catalogue existant ; ils ne sont pas ajoutés à ces
totaux pour éviter de mélanger dataset brut et catalogue réconcilié.

### Scénario A — très sélectif

Règle :

- `CORE` : match legacy certain, ou importance IGN 1–2, hors proéminence
  déclarée inférieure à 30 m ; un conflit lié à un legacy ne bénéficie pas de
  l'override ;
- `SECONDARY` : proéminence déclarée faible, ou importance 3 + OSM + sommet
  supérieur à plus de 1 km ;
- `REFERENCE` : le reste.

| CORE | SECONDARY | REFERENCE | Densité CORE | Densité visible |
| ---: | ---: | ---: | ---: | ---: |
| **96** | **161** | **654** | 2,1 / 100 km² | 5,6 / 100 km² |

Conséquence : découverte très lisible, mais risque fort d'écarter des sommets
locaux pertinents classés IGN 3–4. Avec les 14 legacy qui ne sont pas absorbés
par un match certain, le catalogue compterait environ 110 `CORE` après
réconciliation.

### Scénario B — équilibré, recommandé provisoirement

Règle :

- `CORE` : match legacy certain ; sinon importance 1–2 ; sinon importance 3 +
  OSM + sommet supérieur à plus de 1 km ; la proéminence déclarée inférieure à
  30 m empêche `CORE` hors override ;
- `SECONDARY` : proéminence déclarée faible, autres importance 3, ou importance
  4 + OSM + sommet supérieur à plus de 500 m ;
- `REFERENCE` : le reste, principalement importance 4 dense, 5 et 6.

| CORE | SECONDARY | REFERENCE | Densité CORE | Densité visible |
| ---: | ---: | ---: | ---: | ---: |
| **256** | **280** | **375** | 5,6 / 100 km² | 11,7 / 100 km² |

Composition de `CORE` : 3 objets d'importance 1, 88 d'importance 2 et 165
d'importance 3. 239 des 256 sont appariés OSM, 207 portent un Wikidata via OSM
et 95 un lien Wikipedia.

Conséquence : les sommets régionaux et les vrais objectifs locaux restent
présents, tandis que les pointes de crêtes denses quittent la progression
principale. Avec les 14 legacy qui ne sont pas absorbés par un match certain,
le catalogue compterait environ 270 `CORE` après réconciliation.

### Scénario C — très complet

Règle :

- `CORE` : match legacy certain ou importance IGN 1–3, hors veto de
  proéminence faible ;
- `SECONDARY` : proéminence faible, ou importance 4–5 reconnue OSM et sommet
  supérieur à plus de 250 m, ou sommet supérieur à plus de 1 km ;
- `REFERENCE` : le reste.

| CORE | SECONDARY | REFERENCE | Densité CORE | Densité visible |
| ---: | ---: | ---: | ---: | ---: |
| **394** | **321** | **196** | 8,6 / 100 km² | 15,6 / 100 km² |

Conséquence : riche pour les experts, mais 715 objets deviendraient visibles à
un niveau de zoom ou un autre. Le risque de saturation dans Chamonix et de
découvertes multiples redevient élevé. Avec les 14 legacy qui ne sont pas
absorbés par un match certain, le catalogue compterait environ 408 `CORE`
après réconciliation.

## Les 24 sommets historiques

Décision de tier proposée : **24 `CORE`, 0 `SECONDARY`**.

État de rapprochement, dimension distincte du tier :

| État QA | Nombre |
| --- | ---: |
| Match certain IGN | 10 |
| Candidat lié mais conflit à résoudre | 4 |
| Aucun lien candidat sûr | 10 |
| Legacy nécessitant donc une action QA | **14** |

Les 14 cas QA ne doivent pas disparaître. Ils restent `CORE` dans HOVREN tant
qu'une erreur manifeste n'est pas documentée. Exemples : Mont Charvin,
Aiguille du Midi, Roc de Chère, Parmelan, Semnoz et Tête Pelouse.

## Échantillon humain — scénario B

`Distance sup.` désigne la distance au candidat IGN plus élevé le plus proche.

| Secteur | Nom | Altitude | Prominence disponible | Distance sup. | Tier proposé | Raison principale |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Chamonix | Mont Blanc | 4 765 m | 4 695 m déclarés | dominant | `CORE` | legacy + importance 1 |
| Chamonix | Mont Blanc de Courmayeur | 4 721 m | 17 m déclarés | 601 m | `SECONDARY` | antécime malgré importance 2 |
| Chamonix | Mont Blanc du Tacul | 4 170 m | — | 1 257 m | `CORE` | importance 2 + OSM |
| Chamonix | Aiguille du Plan | 3 590 m | — | 2 069 m | `CORE` | importance 3 + OSM + indépendance spatiale |
| Chamonix | Aiguille du Grépon | 3 354 m | — | 162 m | `SECONDARY` | importance 3 mais crête dense |
| Chamonix | Dent du Crocodile | 3 541 m | — | 170 m | `REFERENCE` | importance 5, point dense malgré OSM |
| Grandes Jorasses | Pointe Walker | 4 083 m | valeur OSM non appariée automatiquement | 7 987 m | `CORE` | importance 3 + OSM positionnel + point principal |
| Grandes Jorasses | Pointe Whymper | 4 074 m | — | 244 m | `REFERENCE` | importance 5, sous-pointe proche de Walker |
| Aravis | Pointe Percée | 2 725 m | 1 654 m déclarés | 17 642 m | `CORE` | legacy + importance 2 |
| Aravis | Mont Charvin | 2 387 m | — | 5 652 m | `CORE` | legacy + importance 2, conflit de position à résoudre |
| Aravis | Tête Pelouse | 2 447 / 2 496 m | — | 1 878 / 1 059 m | `CORE` proposé, revue requise | deux objets homonymes importance 2 |
| Bornes | la Tournette | 2 326 m | 1 518 m déclarés | 10 742 m | `CORE` | legacy + indépendance forte |
| Bornes | Parmelan | 1 856 m legacy | — | non calculable sans lien sûr | `CORE` | préservation legacy, QA de rapprochement |
| Annecy | Mont Veyrier | 1 250 m | — | 816 m | `CORE` | legacy ; exemple d'un sommet bas pertinent |
| Chablais | le Roc d'Enfer | 2 174 m | 1 080 m déclarés | 381 m | `CORE` | importance 2 ; la proéminence corrige le signal de proximité |
| Chablais | Dent d'Oche | 2 162 m | — | 4 517 m | `CORE` | importance 2 + OSM/Wikidata/Wikipedia |
| Chablais | Mont Forchat | 1 514 m | — | 4 869 m | `CORE` | importance 3 + reconnaissance multi-source |
| périphérie | Mont Salève | 1 261 m | — | 3 006 m | `CORE` | importance 1, indépendamment de l'altitude |
| Bauges/périphérie | Dent de Cons | 2 015 m | 1 155 m déclarés | 7 832 m | `CORE` proposé, revue requise | multi-source forte mais toponyme IGN `Collecté` |

Ce benchmark montre deux corrections importantes qu'un filtre par altitude ne
pourrait pas produire : le Petit/Grand Salève restent visibles, tandis que des
pointes de plus de 3 500 m deviennent secondaires ou références.

## Stratégie d'affichage recommandée

### `CORE`

- visible avec les règles de zoom actuelles d'Exploration ;
- présent sur la page Sommets et dans la recherche ;
- éligible à la découverte automatique ;
- comptabilisé dans la progression principale.

### `SECONDARY`

- visible deux niveaux de zoom plus près que `CORE`, seuil exact à calibrer sur
  la carte avant implémentation ;
- recherchable et accessible depuis la fiche du sommet ou massif principal ;
- **informatif dans un premier temps** : pas de découverte automatique et pas
  de progression principale ;
- promotion manuelle possible vers `CORE`.

Le rendre immédiatement collectible réintroduirait le problème « +8 sommets
découverts » sur une arête dense. Une éventuelle collecte secondaire devra
plus tard être séparée du compteur principal.

### `REFERENCE`

- jamais affiché dans l'expérience publique standard ;
- jamais découvert automatiquement ;
- absent de la progression ;
- conservé dans le staging, la provenance et les rapports QA.

Le filtre avancé « Sommets principaux / Tous les sommets visibles » n'est pas
nécessaire tant que le progressive disclosure par zoom n'a pas été testé. Il
n'est pas implémenté dans cette phase.

## Modèle de données proposé, non implémenté

Le besoin d'une dimension séparée est confirmé. Une future migration pourra
introduire :

```text
SummitCatalogTier
  CORE
  SECONDARY
  REFERENCE
```

Le tier doit rester indépendant de `catalogStatus` et `isActive` :

```text
tier = rôle produit
catalogStatus = état de validation
isActive = publication effective
```

Pour l'audit admin futur : `suggestedTier`, `catalogTier`, `tierReason`,
`prominenceMeters`, `prominenceSource`, `tierUpdatedByUserId` et date de
modification. Aucun de ces champs n'a été ajouté pendant cette mission.

## Recommandation Codex

1. retenir le **scénario B comme hypothèse de travail**, pas comme règle finale ;
2. préserver les 24 legacy en `CORE` ;
3. résoudre les 65 conflits et prévoir la désambiguïsation des 25 groupes de
   noms identiques (53 candidats, souvent de vrais homonymes) avant tout
   staging final ;
4. lancer un chantier court de proéminence DEM transfrontalière, d'abord sur
   un benchmark de 50 à 100 candidats couvrant les six secteurs ;
5. recalculer les trois scénarios avec la vraie proéminence ;
6. effectuer une validation humaine ciblée sur les changements de tier et les
   clusters denses, pas une revue manuelle exhaustive des 911 points ;
7. seulement après validation : concevoir la migration, l'admin et le mode
   `--apply` contrôlé.

Le scénario B répond le mieux à l'équilibre actuel : environ 270 `CORE` une
fois les 14 legacy non absorbés par un match certain réintégrés, suffisamment
pour découvrir des sommets locaux sans transformer chaque pointe nommée en
objectif HOVREN.

## Risques restant ouverts

- l'importance IGN mesure le rayonnement cartographique, pas directement
  l'intérêt comme destination outdoor ;
- 901 candidats n'ont aucune proéminence appariée ;
- la distance au sommet supérieur ignore le col clé ;
- l'OSM est contributif et certains appariements homonymes demandent une QA ;
- 836 nouveaux candidats n'ont pas de massif fiable ;
- 61 candidats frontaliers exigent un DEM et une attribution territoriale
  transfrontaliers ;
- 25 groupes, soit 53 candidats, portent un même nom normalisé ;
- les altitudes ponctuelles peuvent différer des altitudes éditoriales ou des
  mesures de référence et ne doivent pas piloter le tier ;
- le scénario B peut encore surclasser certaines antécimes sans proéminence et
  sous-classer de beaux sommets locaux d'importance 4.

## Stop gate de sortie

Le rapport est prêt pour validation humaine. La suite reste interdite jusqu'à
une décision explicite sur :

1. le scénario de calibration ;
2. le statut collectible ou informatif de `SECONDARY` ;
3. la nécessité du pilote DEM ;
4. le traitement des 65 conflits et des 14 rapprochements legacy non certains.

**Aucun import final avant cette validation.**
