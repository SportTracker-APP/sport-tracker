# HOVREN Statistics V1 backup

Snapshot of the Statistics page immediately before the premium "journal de progression vivant" pass.

## Scope

- Public route component for `/statistiques`.
- Feature view, chart, calendar, deterministic calculations, styles and tests.
- Shared activity hook, activity types and chart-period utilities used by the page.
- Shared period selector and dashboard layout dependency.
- Existing Playwright coverage for the page.

No secret, environment file, build output, cache, dependency directory or backend file is included.

## Runtime dependencies

- Next.js App Router
- React
- TypeScript
- TanStack Query
- Recharts
- Lucide React
- CSS Modules

## Restore

1. Keep a copy of the current implementation.
2. Copy `route/page.tsx` to `apps/web/app/statistiques/page.tsx`.
3. Copy `features/statistics/*` to `apps/web/features/statistics/`.
4. Restore shared files only if they were changed after this snapshot; their destinations mirror the folders in this export.
5. Copy `e2e/statistics.spec.ts` to `apps/web/e2e/statistics.spec.ts`.
6. Run the web typecheck, tests and production build.

The feature imports use the project alias `@/`. When reused elsewhere, adapt aliases and the authenticated `DashboardLayout` integration.
