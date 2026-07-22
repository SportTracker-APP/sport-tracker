# Package Dependencies

Dependances directement utiles a la page Refuge ou a son shell connecte.

## Runtime

- `next`
- `react`
- `react-dom`
- `@tanstack/react-query`
- `axios`
- `zustand`
- `lucide-react`
- `recharts`
- `sonner`
- `next-themes`
- `@vercel/analytics`
- `clsx`
- `tailwind-merge`
- `class-variance-authority`
- `radix-ui`

## Styles et build

- `tailwindcss`
- `@tailwindcss/postcss`
- `tw-animate-css`
- `typescript`

## Tests de reference

- `vitest`
- `jsdom`
- `@testing-library/react`
- `@testing-library/user-event`
- `@testing-library/jest-dom`

## Variables attendues

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Notes

- L'archive n'inclut pas `node_modules`.
- L'archive n'inclut pas de lockfile complet, car elle est destinee a la reutilisation et non a remplacer le projet courant.
- Pour une restauration exacte dans HOVREN, utiliser le `package.json` original present dans `reference/config/package.json`.
