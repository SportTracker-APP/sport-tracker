# Environment variables

## `NEXT_PUBLIC_API_URL`

Base URL of the authenticated NestJS API. The legacy client falls back to
`http://localhost:4000` in local development.

## `NEXT_PUBLIC_MAPBOX_TOKEN`

Public browser token used to render the Mapbox map. Use a URL-restricted public
token in production. Never include a secret Mapbox token.
