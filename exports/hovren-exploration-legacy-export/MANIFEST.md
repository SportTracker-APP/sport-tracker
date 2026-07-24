# Manifest

## Route

- `route/page.tsx`: complete legacy page, map integration, transformations,
  filters, states and UI.

## Map

- `map/json_mapbox.json`: custom Mapbox style used by the 3D map.

## Data and services

- `hooks/use-activities.ts`: TanStack Query hook used by the page.
- `services/activities.ts`: activity type and API functions.
- `services/api.ts`: shared Axios client used by the activity service.

## Shared UI

- `components/dashboard-layout.tsx`: authenticated application shell.
- `components/fade-in.tsx`: progressive reveal wrapper used by route rows.

## Styles

- `styles/globals.css`: snapshot of global and legacy `app-map-*` styles.
- `styles/refuge-shell.module.css`: shell styles used by the current HOVREN
  visual language.

## Configuration and reference

- `config/next.config.js`: image/CSP configuration snapshot.
- `reference/package.json`: web package scripts and dependency versions.
- `.env.example`: fictitious environment variable contract.
- `package-dependencies.md`: direct runtime/build dependencies.
- `FUNCTIONAL-AUDIT.md`: behavior and state inventory.

## Deliberately excluded

- `.env`, `.env.local` and all real credentials.
- `node_modules`, `.next`, coverage, caches and build artifacts.
- Backend source and database data.
- Git history and repository metadata.
- Unrelated HOVREN pages and business modules.
