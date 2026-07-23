# Manifest

Export créé le 23 juillet 2026 depuis la branche `main`, commit
`6d1cb0b1e3537ac8b8231c45de80602b5bc6cdba`.

Versions : Next.js 16.2.9, React 19.2.7, TypeScript 5.9.3,
Tailwind CSS 4.3.1.

| Chemin original | Chemin dans l'export | Rôle et raison de l'inclusion | Dépendances principales |
| --- | --- | --- | --- |
| `apps/web/app/sommets/page.tsx` | `route/page.tsx` | Route, filtres, vues, calculs, mutations et rendu historique | React, Next, TanStack Query, Sonner, Lucide |
| `apps/web/app/sommets/sommets.module.css` | `route/sommets.module.css` | Intégralité de la DA et du responsive historiques | CSS Modules |
| `apps/web/components/layout/dashboard-layout.tsx` | `components/layout/dashboard-layout.tsx` | Shell authentifié utilisé par la route | Sidebar, topbar, navigation mobile |
| `apps/web/components/layout/mobile-bottom-navigation.tsx` | `components/layout/mobile-bottom-navigation.tsx` | Navigation mobile et état actif Sommets | Next, Lucide |
| `apps/web/components/layout/mobile-sidebar.tsx` | `components/layout/mobile-sidebar.tsx` | Drawer mobile du shell | Next, auth store |
| `apps/web/components/layout/notification-center.tsx` | `components/layout/notification-center.tsx` | Dépendance directe de la topbar | activités, sommets, badges |
| `apps/web/components/layout/refuge-shell.module.css` | `components/layout/refuge-shell.module.css` | Styles partagés importés par le shell actuel | CSS Modules, asset forêt |
| `apps/web/components/layout/topbar.tsx` | `components/layout/topbar.tsx` | Topbar, compte, thème et déconnexion | auth, thème, notifications |
| `apps/web/components/navigation/sidebar.tsx` | `components/navigation/sidebar.tsx` | Navigation desktop et statut Strava | API, auth store, Next |
| `apps/web/components/summits/summit-celebration-monitor.tsx` | `components/summits/summit-celebration-monitor.tsx` | Cohérence des notifications de nouvelle découverte | hook sommets, Sonner |
| `apps/web/components/theme/theme-switcher.tsx` | `components/theme/theme-switcher.tsx` | Dépendance du menu de compte | React, Lucide |
| `apps/web/components/ui/confirmation-dialog.tsx` | `components/ui/confirmation-dialog.tsx` | Confirmation accessible du retrait d'une découverte | React portal, Lucide |
| `apps/web/components/ui/confirmation-dialog.module.css` | `components/ui/confirmation-dialog.module.css` | Styles de la modale de confirmation | CSS Modules |
| `apps/web/components/ui/fade-in.tsx` | `components/ui/fade-in.tsx` | Apparition progressive historique des sections et cartes | Framer Motion |
| `apps/web/components/ui/page-transition.tsx` | `components/ui/page-transition.tsx` | Transition du shell authentifié | Framer Motion, Next |
| `apps/web/hooks/use-summits.ts` | `hooks/use-summits.ts` | Requêtes et mutations TanStack Query | summit-api |
| `apps/web/hooks/use-activities.ts` | `hooks/use-activities.ts` | Dépendance du centre de notifications | activities service |
| `apps/web/lib/api.ts` | `services/api.ts` | Client Axios, authentification et refresh de session | Axios |
| `apps/web/lib/auth.ts` | `services/auth.ts` | Déconnexion utilisée par la topbar | API |
| `apps/web/lib/summit-api.ts` | `services/summit-api.ts` | Endpoints sommets, badges et découvertes | Axios client, SummitView |
| `apps/web/lib/activities.ts` | `services/activities.ts` | Contrat activité et requête du shell | Axios client |
| `apps/web/lib/badge-icons.ts` | `services/badge-icons.ts` | Icônes du centre de notifications | Lucide |
| `apps/web/lib/summits.ts` | `types/summits.ts` | Catalogue, difficulté, type et normalisation | TypeScript |
| `apps/web/lib/summit-discovery.ts` | `types/summit-discovery.ts` | Vue enrichie, activités liées et progression par massif | Summit, Activity |
| `apps/web/store/auth-store.ts` | `stores/auth-store.ts` | Session utilisateur et visibilité Admin | Zustand |
| `apps/web/app/globals.css` | `styles/globals.css` | Tokens globaux, Tailwind et shell historique | Tailwind CSS |
| `apps/web/public/images/sidebar-pine-forest.svg` | `assets/sidebar-pine-forest.svg` | Décor local utilisé par le shell partagé | SVG local |
| `apps/web/components/layout/notification-center.test.tsx` | `tests/notification-center.test.tsx` | Test existant le plus proche du flux sommets dans le shell | Vitest, Testing Library |
| Aucun fichier réel | `.env.example` | Configuration publique minimale et nettoyée | Next.js |
| `apps/web/package.json` | `package-dependencies.md` | Versions et commandes utiles retranscrites sans copier le workspace | npm |

## Relations importantes

```text
route/page.tsx
├── DashboardLayout
│   ├── Sidebar
│   ├── Topbar
│   ├── MobileBottomNavigation
│   └── SummitCelebrationMonitor
├── ConfirmationDialog
├── FadeIn
└── use-summits
    └── summit-api
        └── api
```

Les imports `@/` restent exprimés selon leurs chemins d'origine. Le README
décrit leur réintégration.

