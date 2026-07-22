# HOVREN Refuge Legacy Export

Export de sauvegarde de la page Refuge HOVREN telle qu'elle existe au moment de la refonte.

Cette archive est une copie de reference. Elle ne remplace pas les fichiers actifs de l'application et ne contient aucun secret.

## Route sauvegardee

- Route publique/connectee : `/refuge`
- Fichier Next.js App Router : `route/page.tsx`
- Implementation reelle : `features/dashboard/dashboard-page.tsx`

La page `/refuge` rend le dashboard principal via `DashboardPage`.

## Structure

- `route/` : point d'entree Next.js de la route Refuge.
- `features/dashboard/` : page Refuge/dashboard, styles CSS module et messages editoriaux du refuge.
- `components/` : composants utilises par la page ou son shell connecte.
- `hooks/` : hooks React Query pour activites, objectifs et sommets.
- `services/` : clients API et types de service necessaires.
- `schemas/` : schemas Zod lies aux activites.
- `types/` : types TypeScript partages.
- `stores/` : store Zustand d'authentification.
- `utils/` : helpers de calcul, formatage, progression, sommets et badges.
- `styles/` : styles globaux necessaires au rendu connecte.
- `assets/` : assets locaux references par le shell.
- `reference/` : fichiers de contexte indispensables pour comprendre la page dans l'app complete.

## Fonctionnalites couvertes

La page Refuge actuelle couvre notamment :

- hero dashboard "carnet de sommets" ;
- CTA vers creation de sortie, synchronisation Strava et carnet de sommets ;
- etat Strava connecte/non connecte ;
- resume mensuel et indicateurs d'activite ;
- graphique d'activite par periode ;
- selection de periode du graphique ;
- dernieres traces avec liens vers fiches activite ;
- objectif en cours et progression ;
- badges recents ;
- recommandations editoriales du refuge ;
- section carnet de sommets avec derniere decouverte, progression, prochaine idee et badge a viser ;
- notification persistante de nouveau sommet decouvert ;
- centre de notifications dans la topbar ;
- navigation desktop et mobile ;
- themes nature/violet ;
- etats loading, error et empty.

## Etats sauvegardes

- Loading : chargement de la page/dashboard, hydratation auth, requetes React Query.
- Error : erreur de chargement des donnees dashboard.
- Empty : absence de sortie, absence de Strava, absence de sommet ou absence de badge.
- Success : affichage complet des sorties, objectifs, sommets, badges, progression et suggestions.

## Interactions utilisateur

- navigation vers `/activites/nouvelle`, `/integrations/strava`, `/sommets`, `/badges`, `/objectifs`, `/calendrier`, `/journal` ;
- changement de periode du graphique ;
- changement de metrique graphique ;
- consultation d'une activite depuis les listes et heatmaps ;
- masquage de notification de sommet ;
- ouverture du centre de notifications ;
- changement de theme nature/violet ;
- ouverture navigation mobile ;
- deconnexion depuis la topbar.

## Services et endpoints utilises

Les appels passent par `services/api.ts`, qui utilise `NEXT_PUBLIC_API_URL`.

Endpoints principaux :

- `GET /activities`
- `GET /activities/:id`
- `PATCH /activities/:id`
- `DELETE /activities/:id`
- `POST /activities/planned-workouts/:plannedWorkoutId/complete`
- `PATCH /activities/planned-workouts/:plannedWorkoutId/celebration-seen`
- `GET /activities/:id/planned-workout-suggestion`
- `GET /goals`
- `POST /goals`
- `PATCH /goals/:id`
- `DELETE /goals/:id`
- `GET /summits`
- `GET /summits/badges`
- `PATCH /summits/discoveries/:discoveryId`
- `DELETE /summits/:summitId/discovery`
- `GET /strava/status`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /users/me`

## Variables d'environnement

Pour reutiliser cette page dans un autre projet, prevoir au minimum :

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Le store auth lit aussi `localStorage.accessToken`. La session refresh utilise des cookies HTTP-only cote API.

## Notes de restauration

1. Copier les dossiers dans un projet Next.js App Router compatible.
2. Restaurer les alias TypeScript `@/*` vers la racine web.
3. Installer les dependances listees dans `package-dependencies.md`.
4. Brancher `ThemeProvider`, `QueryProvider` et `AuthProvider` autour de l'app.
5. Verifier que l'API expose les endpoints listes plus haut.
6. Adapter les routes si le projet cible n'utilise pas les memes URLs.

## Specificites HOVREN a adapter

- vocabulaire produit : refuge, traces, sommets, carnet, badges ;
- routes internes HOVREN ;
- types de sport et d'objectifs ;
- structure des donnees activites/sommets/badges/objectifs ;
- logique Strava ;
- stockage `localStorage` du token d'acces ;
- classes globales de theme nature/violet ;
- assets et images externes referencees dans CSS/helpers.

## Exclusions volontaires

Non inclus :

- `.env`, `.env.local` et secrets ;
- `node_modules` ;
- `.next` ;
- caches ;
- resultats Playwright/Vitest ;
- migrations et backend ;
- assets generiques non utilises par Refuge ;
- anciennes archives d'export.
