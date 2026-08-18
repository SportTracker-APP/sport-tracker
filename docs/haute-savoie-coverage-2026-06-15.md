# Rapport de couverture Haute-Savoie — pré-import

Date du dry-run : 17 août 2026.

## Source de vérité

| Élément | Valeur |
| --- | ---: |
| Source | IGN BD TOPO® 3.5 — Détail orographique |
| Édition | 2026-06-15 |
| Périmètre | D074 |
| MD5 | `efa8b87b3751e737d90895e494f875f7` |
| Features source examinées | 2 849 |

## Résultat du pipeline

| Catégorie | Nombre |
| --- | ---: |
| Candidats selon la whitelist `Sommet` / `Pic` et le périmètre | 911 |
| Importables sans conflit | 846 |
| Matchs certains avec les 24 sommets historiques | 10 |
| Nouveaux candidats | 836 |
| Conflits | 65 |
| Rejetés avec raison explicite | 1 938 |
| Sans nom | 0 |
| Sans coordonnées | 0 |
| Sans altitude après enrichissement IGN | 0 |
| Sans massif fiable | 836 |
| Écarts inexpliqués dans le référentiel principal | **0** |

Répartition des rejets :

- 1 872 features dont la nature IGN n’appartient pas à la whitelist ;
- 66 features `Sommet` / `Pic` hors du périmètre retenu et au-delà de leur
  précision planimétrique.

## Stop gate no 1

Le dry-run fonctionne, mais l’application est **bloquée volontairement** :

- 61 candidats frontaliers sont à examiner avant affectation ;
- 4 rapprochements legacy sont ambigus ;
- seuls 10 des 24 sommets historiques ont un match certain ;
- 14 sommets historiques restent sans référence IGN certaine.

Exemples de cas legacy à contrôler : Aiguille du Midi (écart 114 m), Mont
Charvin (écart 1 076 m), Pointe de Domingit proche de l’Aiguille Verte du Bargy
avec un autre nom, et le Thoron proche du Roc de Chère avec un autre nom.

Aucun `--apply`, aucune migration de base de production et aucune publication
ne sont autorisés tant que ces cas n’ont pas une résolution documentée.

## Contre-vérification OpenStreetMap

Source QA : extraction Overpass `natural=peak` dans `FR-74`, © OpenStreetMap
contributors, ODbL 1.0.

| Catégorie QA OSM | Nombre |
| --- | ---: |
| Peaks inspectés | 958 |
| Match par nom et proximité | 548 |
| Match purement positionnel à 80 m maximum | 88 |
| Sans match automatique conservateur | 322 |
| Dont sans nom OSM | 100 |
| Dont nommés à investiguer | 222 |

Les 322 éléments ne sont pas importés et ne prouvent pas automatiquement une
lacune IGN : ils comprennent notamment des sous-sommets, passages ou points
OSM dont la classification diffère du contrat BD TOPO, des graphies distinctes
et de possibles vrais écarts. Ils constituent une file de QA humaine. Exemples
visibles dans le rapport : Crêt de Châtillon, Grandes Jorasses / Pointe Walker,
Roc Lancrenaz, Croix d’Almet et plusieurs sous-points des Dômes de Miage.

La couverture finale n’est donc pas déclarée terminée à ce stade. Le pipeline
principal a zéro disparition inexpliquée, mais le contre-référentiel laisse
222 objets nommés à qualifier.

## Reproductibilité

Le rapport JSON détaillé est généré hors Git avec :

```bash
npm run summits:qa:osm -- \
  --snapshot-dir=/chemin/vers/BDT_3-5_SHP_LAMB93_D074_ED2026-06-15 \
  --source-version=2026-06-15 \
  --osm-snapshot=/chemin/vers/osm-haute-savoie-peaks.json \
  --report=/tmp/hovren-haute-savoie-osm-qa.json
```
