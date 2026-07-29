# Elevation profile

The legacy route reads optional `altitudeStream` and `distanceStream` arrays
from the activity response and renders them with Recharts. It samples long
series before display and derives visible minimum/maximum values.

The archived page also contained a synthetic fallback when no altitude stream
was available. This behavior belongs to the legacy implementation and should
not be reused where presenting only measured data is required.
