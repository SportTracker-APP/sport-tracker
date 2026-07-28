# HOVREN Sorties legacy export

Sauvegarde de la page `/activites` avant sa refonte en carnet de terrain.

## Contenu

- `route/page.tsx` : route historique complète.
- `components/activities/` : cartes, filtres et aperçu GPS.
- `components/ui/` : composants partagés directement utilisés.
- `components/layout/` : shell authentifié de référence.
- `hooks/use-activities.ts` : requêtes TanStack Query.
- `services/` : contrat TypeScript et client API utilisés par la page.
- `styles/globals.css` : styles globaux au moment de l’export.
- `package.json` et `package-dependencies.md` : dépendances nécessaires.
- `MANIFEST.md` : inventaire fonctionnel et procédure de restauration.

## Réutilisation

1. Copier `route/page.tsx` vers une route Next.js App Router.
2. Restaurer les composants et adapter les alias `@/`.
3. Fournir un `QueryClientProvider` TanStack Query et un contexte
   d’authentification compatible avec `services/api.ts`.
4. Définir `NEXT_PUBLIC_API_URL`.
5. Définir éventuellement `NEXT_PUBLIC_TOPO_TILE_URL`. Sans cette variable,
   OpenTopoMap est utilisé.
6. Reprendre uniquement les sélecteurs `app-activities-*`,
   `app-activity-*`, `app-mini-route-map` et `app-map-*` utiles depuis
   `styles/globals.css`.

## Parties spécifiques à HOVREN

- `DashboardLayout` et le thème `sport-theme-nature`.
- La route API `/activities`.
- Les routes `/activites/nouvelle` et `/activites/[id]`.
- Les statuts et sports définis par le backend HOVREN.
- Les tokens visuels présents dans `globals.css`.

## Sécurité

Cette archive ne contient aucun fichier `.env`, jeton JWT, token Strava,
token Mapbox, donnée utilisateur, cache ou artefact de build.

