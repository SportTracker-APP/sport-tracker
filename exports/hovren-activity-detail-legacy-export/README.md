# HOVREN Activity Detail Legacy Export

This archive preserves the activity detail page that existed before the
editorial expedition redesign.

## Route

- Public application route: `/activites/[id]`
- Archived entry point: `route/page.tsx`
- The page is authenticated by the existing HOVREN application shell and API.

## What is included

- The complete legacy route and its CSS module.
- The Mapbox route viewer, mini route fallback and related styles.
- The TanStack Query activity hook.
- The activity API contract and supporting summit types used by the map.
- The authenticated shell and fade-in utility referenced by the route.
- The Mapbox style JSON and the legacy fallback image catalogue.
- Documentation covering dependencies, endpoints, environment variables,
  Strava data, elevation data and restoration.

## Required dependencies

See `package-dependencies.md`. The archived `reference/web-package.json`
contains the full web package manifest at export time.

## Environment

Copy `.env.example` into the consuming project's local environment and replace
the placeholders. Never commit real values.

## Reuse in another project

1. Recreate the `@/` alias or update imports.
2. Provide a TanStack Query provider and the authenticated Axios client.
3. Copy the route, map components, CSS and JSON map style.
4. Adapt the `Activity` API contract in `services/activities.ts`.
5. Configure the public Mapbox token and API URL.
6. Reconnect the page to the consuming application's authenticated layout.

## HOVREN-specific parts

- French product copy and `/activites` routes.
- `DashboardLayout`, authentication events and API refresh behavior.
- Summit catalogue overlays rendered by the Mapbox component.
- HOVREN fallback media and paper styling.
- Planned-workout matching.

These areas should be reviewed before reuse outside HOVREN.

## Restore

See `docs/RESTORE.md`.
