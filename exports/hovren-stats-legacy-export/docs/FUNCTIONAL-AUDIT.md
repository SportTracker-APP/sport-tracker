# Audit fonctionnel de la version sauvegardée

## Route

`/statistiques`, rendue côté client par `app/statistiques/page.tsx`.

## Source des données

La page utilise `useActivities()`, qui exécute `GET /activities` avec TanStack
Query. Les activités planifiées sont exclues des analyses.

## Calculs

- totaux de distance, durée, dénivelé, calories et nombre d'activités ;
- comparaisons semaine et mois en cours avec la période précédente ;
- répartition par discipline ;
- régularité sur quatre semaines ;
- activité la plus longue et journée la plus active ;
- meilleur dénivelé, plus longue distance et durée maximale ;
- agrégations du graphique pour 7 jours, 30 jours, 3 mois et 12 mois.

## Interactions

- changement de période, conservé dans `localStorage` ;
- changement de métrique du graphique ;
- cellules actives du calendrier ouvrant une fiche activité ;
- accès à la dernière activité et au Refuge.

## États

- chargement ;
- erreur avec relance de la requête ;
- collection vide ;
- graphique et calendrier vides sans donnée sur la période.

## Limites de l'ancienne implémentation

- route monolithique de plus de 1 300 lignes ;
- styles construits par surcharges du Dashboard historique ;
- hiérarchie visuelle proche d'un tableau de bord analytique ;
- composants et calculs difficiles à tester isolément.

