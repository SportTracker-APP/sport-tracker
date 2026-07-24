# HOVREN Exploration legacy export

This archive preserves the Exploration page as it existed before the atlas
redesign. It is a read-only reference copy: the running HOVREN application does
not import anything from this folder.

## Original route

- Public path after authentication: `/carte`
- App Router source: `apps/web/app/carte/page.tsx`
- Exported copy: `route/page.tsx`

## What the page does

- Fetches the authenticated user's activities through TanStack Query.
- Keeps completed outdoor activities that contain a route polyline.
- Decodes Google encoded polylines in the browser.
- Filters routes by running, trail, hiking/walking and cycling.
- Loads Mapbox GL JS and its stylesheet dynamically.
- Renders terrain, fog, summit markers and activity traces.
- Uses one GeoJSON source for visible traces and updates it with `setData`.
- Fits the camera to the filtered routes without recreating the map.
- Selects a route from the map or the notable-routes list.
- Shows a compact Mapbox preview and links to the activity detail.
- Handles loading, API error, no-route and Mapbox configuration/error states.

## Restore inside HOVREN

1. Copy `route/page.tsx` back to `apps/web/app/carte/page.tsx`.
2. Copy `map/json_mapbox.json` back to `apps/web/app/json_mapbox.json`.
3. Restore the shared files only if they were also changed after this export.
4. Keep the current project aliases (`@/`) and Next.js App Router structure.
5. Configure the variables listed in `.env.example`.
6. Install the dependencies listed in `package-dependencies.md`.

Do not copy the exported `globals.css` over a newer project without reviewing
the diff first: it contains application-wide styles, not only Exploration.

## Reuse in another project

The original route is intentionally self-contained. To reuse it:

1. Move `route/page.tsx` into a client route.
2. Adapt the `@/` aliases or replace them with local paths.
3. Provide an authenticated API exposing `GET /activities`.
4. Match the `Activity` contract in `services/activities.ts`.
5. Provide a layout in place of `DashboardLayout`.
6. Copy the Mapbox style and configure a public Mapbox token.
7. Review the Content Security Policy entries from `config/next.config.js`.

## HOVREN-specific areas

- French editorial copy and HOVREN visual tokens.
- `DashboardLayout`, navigation and authentication context.
- `@/lib/api` and its token/cookie handling.
- Activity detail links at `/activites/:id`.
- The summit marker catalogue embedded in the route.
- Global `app-map-*` compatibility styles.

## Security

No real `.env` file, API key, JWT, user data or database export is included.
The example environment file contains placeholders only.
