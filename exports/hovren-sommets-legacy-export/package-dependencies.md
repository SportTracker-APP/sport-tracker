# Dépendances

Versions installées au moment de l'export :

## Exécution

- Next.js `16.2.9`
- React `19.2.7`
- React DOM `19.2.7`
- TanStack Query `5.100.14`
- Axios `1.16.1`
- Framer Motion `12.40.0`
- Lucide React `1.16.0`
- Sonner `2.0.7`
- Zustand `5.0.13`

## Développement

- TypeScript `5.9.3`
- Tailwind CSS `4.3.1`
- ESLint `9`
- Vitest `4.1.10`
- Testing Library React `16.3.2`
- Playwright `1.61.1`

## Providers attendus

L'application hôte doit fournir :

- un `QueryClientProvider` TanStack Query ;
- un composant `Toaster` Sonner ;
- les polices et variables du shell HOVREN ;
- les aliases TypeScript `@/*`.

## Commandes de contrôle

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

