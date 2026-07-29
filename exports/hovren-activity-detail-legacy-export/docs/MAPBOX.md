# Mapbox

`activity-mapbox-route.tsx` dynamically loads Mapbox GL JS and its stylesheet,
creates one map instance in a ref, adds terrain, the activity GeoJSON route,
start/end markers and a nearby-summit overlay.

The instance is removed on unmount. The camera is fitted to the decoded route.
When the token, GPS route or runtime is unavailable, the component renders the
mini route fallback.

`assets/json_mapbox.json` is the style definition used by the legacy page.
