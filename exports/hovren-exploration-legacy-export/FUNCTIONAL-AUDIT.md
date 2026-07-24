# Functional audit

## Data flow

1. `useActivities()` requests `GET /activities`.
2. Planned activities are excluded.
3. Activities without a route or outside the outdoor sport set are excluded.
4. Encoded polylines are decoded into latitude/longitude points.
5. Routes are sorted by date and filtered in memory.
6. At most 18 routes are sent to the main map; the selected route is retained
   even when it falls outside that recent subset.

## Interactions

- Select sport filter.
- Select a route by clicking its Mapbox line.
- Select a route from the notable-routes list.
- Pan, zoom, pitch and rotate the main map.
- Open the selected activity detail.

## Derived indicators

- Number of usable traces.
- Filtered distance.
- Filtered positive elevation.
- Distinct start zones, rounded to two coordinate decimals.
- Five highest-elevation routes for the active filter.

## Map implementation

- Mapbox GL JS `v3.10.0`, dynamically loaded.
- Custom style in `map/json_mapbox.json`.
- Terrain source already present in that style.
- One `sport-traces` GeoJSON source.
- Halo, normal and selected line layers reuse that source.
- `setData` updates filter results without recreating the map.
- `setFilter` updates selection.
- The instance and all listeners are removed on unmount.

## UI states

- API loading.
- API error.
- No compatible route.
- Mapbox token absent.
- Mapbox loading.
- Mapbox error or timeout.
- Selected route.
- No selected route.

## Constraints retained by the export

- No mutation or write operation.
- No new backend endpoint.
- No direct Strava request from the browser.
- Existing authenticated Axios client remains the only API transport.
