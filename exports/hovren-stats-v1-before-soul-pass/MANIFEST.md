# Manifest

Created before the Statistics V2 visual pass.

## Route

- `route/page.tsx`

## Statistics feature

- `features/statistics/statistics-view.tsx`
- `features/statistics/statistics-chart.tsx`
- `features/statistics/statistics-calendar.tsx`
- `features/statistics/statistics-utils.ts`
- `features/statistics/statistics-utils.test.ts`
- `features/statistics/statistics.module.css`

## Shared dependencies

- `hooks/use-activities.ts`
- `lib/activities.ts`
- `lib/activity-chart-period.ts`
- `lib/activity-chart-period.test.ts`
- `lib/activity-fallback-images.ts`
- `components/dashboard/activity-period-select.tsx`
- `components/dashboard/activity-period-select.test.tsx`
- `components/layout/dashboard-layout.tsx`

## Verification

- `e2e/statistics.spec.ts`

## Deliberately excluded

- `.env*`, credentials and tokens
- `node_modules`, `.next`, coverage and caches
- backend, database and authentication implementation
- unrelated shared UI and other application pages
