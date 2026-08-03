# Manifest

## Route

- `route/page.tsx`: ancienne route `/statistiques`.

## Composants

- `components/dashboard-layout.tsx`: shell historique et variante HOVREN.
- `components/activity-period-select.tsx`: sélecteur 7 jours, 30 jours,
  3 mois et 12 mois.

## Données

- `hooks/use-activities.ts`: requête TanStack Query.
- `services/activities.ts`: contrat TypeScript `Activity` et appels REST.
- `utils/activity-chart-period.ts`: agrégation temporelle du graphique.
- `tests/activity-chart-period.test.ts`: tests unitaires de cette agrégation.

## Styles

- `styles/statistiques.module.css`: styles et adaptations de la page.
- `styles/dashboard.module.css`: styles partagés hérités par l'ancienne page.
- `styles/refuge-shell.module.css`: shell HOVREN disponible au moment de
  l'export.

## Référence

- `reference/package.json`: versions des dépendances du frontend.
- `package-dependencies.md`: dépendances réellement utilisées.
- `docs/FUNCTIONAL-AUDIT.md`: fonctions, états et interactions recensés.
- `docs/RESTORE.md`: procédure de restauration.

## Empreinte fonctionnelle

- une requête publique applicative: `GET /activities`;
- quatre périodes persistées dans le navigateur;
- trois métriques de graphique: distance, dénivelé et durée;
- calendrier d'activité avec accès à la fiche d'une activité;
- états chargement, erreur et collection vide;
- liens vers Refuge et la dernière activité.

