# Manifest

## Audit prealable

### Route

- `/refuge`
- `apps/web/app/refuge/page.tsx`

### Page associee

- `apps/web/features/dashboard/dashboard-page.tsx`
- `apps/web/features/dashboard/dashboard.module.css`
- `apps/web/features/dashboard/refuge-messages.ts`

### Composants utilises

- `components/layout/dashboard-layout.tsx`
- `components/layout/topbar.tsx`
- `components/layout/mobile-sidebar.tsx`
- `components/layout/mobile-bottom-navigation.tsx`
- `components/layout/notification-center.tsx`
- `components/layout/topbar-runner.tsx`
- `components/navigation/sidebar.tsx`
- `components/dashboard/activity-period-select.tsx`
- `components/dashboard/weekly-activity-chart.tsx`
- `components/dashboard/activity-heatmap.tsx`
- `components/summits/summit-celebration-monitor.tsx`
- `components/theme/theme-switcher.tsx`
- `components/ui/avatar.tsx`
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/fade-in.tsx`
- `components/ui/input.tsx`
- `components/ui/page-transition.tsx`
- `components/ui/sheet.tsx`

### Hooks

- `hooks/use-activities.ts`
- `hooks/use-goals.ts`
- `hooks/use-summits.ts`

### Services et appels API

- `services/api.ts`
- `services/activities.ts`
- `services/goals.ts`
- `services/summit-api.ts`
- `services/auth.ts`

### Schemas Zod

- `schemas/activity.schema.ts`

### Types TypeScript

- `types/workout.ts`
- Types embarques dans `services/activities.ts`, `services/goals.ts`, `services/summit-api.ts`, `utils/summit-discovery.ts`.

### Store Zustand

- `stores/auth-store.ts`

### Helpers et utilitaires

- `utils/activity-chart-period.ts`
- `utils/activity-fallback-images.ts`
- `utils/badge-icons.ts`
- `utils/goal-progress.ts`
- `utils/summit-discovery.ts`
- `utils/summits.ts`
- `utils/utils.ts`

### Styles

- `styles/globals.css`
- `features/dashboard/dashboard.module.css`
- styles Tailwind inline dans les composants de shell.

### Assets locaux

- `assets/sidebar-pine-forest.svg`

### References de contexte

- `reference/app/layout.tsx`
- `reference/providers/auth-provider.tsx`
- `reference/providers/query-provider.tsx`
- `reference/providers/theme-provider.tsx`
- `reference/auth/login-hero.tsx`
- `reference/auth/login.module.css`
- `reference/auth/x-social-link.tsx`
- `reference/config/package.json`
- `reference/config/tsconfig.json`
- `reference/config/next.config.js`
- `reference/config/postcss.config.mjs`
- `reference/config/components.json`
- `reference/tests/activity-chart-period.test.ts`
- `reference/tests/activity-period-select.test.tsx`
- `reference/tests/notification-center.test.tsx`

## Dependances externes d'images

Certaines images sont referencees par URL distante dans :

- `styles/globals.css`
- `features/dashboard/dashboard.module.css`
- `utils/activity-fallback-images.ts`
- `components/layout/dashboard-layout.tsx`
- `components/navigation/sidebar.tsx`

Ces URLs ne sont pas telechargees dans l'archive afin de ne pas modifier la source et de garder le comportement actuel.

## Liens fonctionnels avec le reste du produit

Refuge est relie a :

- Activites : affichage, heatmap, dernieres traces, fiches activite, creation de sortie.
- Sommets : carnet, decouvertes, notifications, progression par massif, prochaines idees.
- Objectifs : objectif principal, progression, periode, valeur formatee.
- Badges : badges debloques, prochain badge a viser, centre de notifications.
- Strava : statut de connexion et CTA synchronisation.
- Auth : protection de route, hydratation utilisateur, deconnexion, refresh session.
- Theme : theme nature/violet via `sport-tracker-theme-v3`.

## Integrite de sauvegarde

Cette sauvegarde est une copie. Aucun fichier source actif n'a ete deplace, supprime ou modifie.
