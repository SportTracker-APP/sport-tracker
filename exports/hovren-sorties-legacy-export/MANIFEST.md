# Manifest

## Route

- URL : `/activites`
- Entrée : `route/page.tsx`
- Création : `/activites/nouvelle`
- Détail : `/activites/[id]`

## Endpoint

- `GET /activities`

La réponse est un tableau d’objets `Activity` défini dans
`services/activities.ts`.

## Fonctionnalités conservées

- chargement TanStack Query ;
- exclusion des séances planifiées et des doublons liés ;
- filtres Tous, Course, Cyclisme, VTT, Trail, Musculation et Randonnée ;
- compteur filtré ;
- pagination locale par dix éléments ;
- synthèse annuelle distance, durée et calories ;
- navigation vers le détail ;
- création d’une sortie ;
- aperçu GPS à partir de `routePolyline` ;
- états loading, error et empty.

## Aperçus GPS

`components/activities/mini-route-map.tsx` :

- décode une polyline Google encodée ;
- choisit automatiquement un niveau de zoom ;
- compose des tuiles topographiques dans un SVG ;
- superpose le tracé, le départ et l’arrivée ;
- n’instancie pas Mapbox GL ;
- utilise `NEXT_PUBLIC_TOPO_TILE_URL` ou OpenTopoMap.

## Procédure de restauration dans HOVREN

1. Remplacer `apps/web/app/activites/page.tsx` par `route/page.tsx`.
2. Restaurer les trois fichiers de `components/activities/`.
3. Restaurer `hooks/use-activities.ts` et `services/activities.ts` seulement
   si leurs contrats ont changé.
4. Restaurer les règles historiques depuis `styles/globals.css`.
5. Exécuter le typecheck, le lint, les tests et le build de `apps/web`.

## Fichiers de référence partagés

`DashboardLayout`, `Button`, `FadeIn` et `api.ts` sont inclus pour documenter
les dépendances. Leur restauration complète dans un autre projet nécessite
d’adapter leurs propres imports au shell cible.

