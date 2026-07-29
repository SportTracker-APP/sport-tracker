# Restore procedure

1. Back up the current route.
2. Copy `route/page.tsx` to `apps/web/app/activites/[id]/page.tsx`.
3. Copy `styles/activity-detail.module.css` beside that route.
4. Restore the archived activity map components and CSS under
   `apps/web/components/activities/`.
5. Restore hooks/contracts only if their current versions are incompatible.
6. Restore `assets/json_mapbox.json` to `apps/web/app/json_mapbox.json`.
7. Configure the two public environment variables.
8. Install the dependencies listed in `package-dependencies.md`.
9. Run web typecheck, lint, tests and production build.

Do not overwrite newer authentication or API infrastructure without reviewing
the diff first.
