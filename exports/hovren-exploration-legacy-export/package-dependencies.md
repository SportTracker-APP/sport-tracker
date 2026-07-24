# Package dependencies

The exported page relies on the versions declared in `reference/package.json`.
Its direct dependencies are:

- `next`
- `react`
- `react-dom`
- `@tanstack/react-query`
- `axios`
- `lucide-react`

Mapbox GL JS `v3.10.0` is loaded from the official Mapbox CDN at runtime by the
legacy page. It was not installed as an npm dependency.

The original project also needs:

- TypeScript and the `@/` path alias.
- CSS Modules and Tailwind/global CSS support.
- A QueryClient provider.
- The HOVREN authenticated shell and API token handling.
