# Manifest

## Route

- `route/page.tsx`

## Components

- `components/activity-mapbox-route.tsx`
- `components/mini-route-map.tsx`
- `components/dashboard-layout.tsx`
- `components/fade-in.tsx`

## Hooks

- `hooks/use-activities.ts`
- `hooks/use-summits.ts`

## Services and contracts

- `services/activities.ts`
- `services/api.sanitized-reference.ts`
- `types/summits.ts`
- `types/summit-discovery.ts`

## Styles and assets

- `styles/activity-detail.module.css`
- `styles/mapbox-route-map.module.css`
- `assets/activity-fallback-images.ts`
- `assets/json_mapbox.json`

## Reference

- `reference/web-package.json`
- `reference/next.config.ts`

## Documentation

- `README.md`
- `package-dependencies.md`
- `.env.example`
- `docs/ENDPOINTS.md`
- `docs/ENVIRONMENT.md`
- `docs/MAPBOX.md`
- `docs/ELEVATION.md`
- `docs/STRAVA.md`
- `docs/RESTORE.md`

## Deliberately excluded

- Real `.env` files and all credentials.
- JWTs, cookies, access/refresh tokens and Strava secrets.
- User data, logs and database exports.
- `node_modules`, `.next`, caches and generated build output.
