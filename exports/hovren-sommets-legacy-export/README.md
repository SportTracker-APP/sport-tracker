# HOVREN Sommets Legacy Export

Archive fonctionnelle de la page Sommets avant sa refonte éditoriale de juillet
2026.

## Contexte

- Route d'origine : `/sommets`
- Fichier d'origine : `apps/web/app/sommets/page.tsx`
- Branche : `main`
- Commit de référence : `6d1cb0b1e3537ac8b8231c45de80602b5bc6cdba`
- Date de l'export : 23 juillet 2026

Cette copie ne remplace aucun fichier de production. Elle permet de restaurer
la page historique, d'en comparer les comportements ou d'en extraire des
composants dans un autre projet.

## Rôle de la page

La page présente le catalogue des sommets et la collection personnelle de
l'utilisateur. Elle transforme les détections issues des traces d'activités en
trois états visibles :

- `Découvert` : une découverte confirmée est associée au sommet ;
- `À confirmer` : une détection automatique attend une décision ;
- `À découvrir` : aucune découverte ni détection en attente ;
- `Tous` : réunion des trois états.

Le backend reste la source de vérité. La page ne détecte pas elle-même les
sommets et ne manipule aucun token Strava.

## Fonctionnalités conservées

- chargement du catalogue avec TanStack Query ;
- progression globale et par massif ;
- dernière découverte, plus haut sommet et massifs explorés ;
- recommandation du prochain sommet fondée sur le massif incomplet puis la
  distance à vol d'oiseau disponible ;
- recherche insensible aux accents et prise en compte des aliases ;
- filtres par statut, massif, difficulté et tranche d'altitude ;
- tris par découverte, altitude, nom et nombre de passages ;
- vues grille et liste ;
- synchronisation des filtres et de la vue dans l'URL ;
- liens vers les activités associées ;
- confirmation ou rejet d'une détection automatique ;
- retrait d'un sommet des découvertes avec confirmation accessible ;
- réapparition possible du sommet après une future trace ;
- invalidation des caches `summits` et `summit-badges` après mutation ;
- toasts de succès et d'erreur ;
- prise en charge des états chargement, erreur, vide et succès ;
- navigation dans le shell authentifié et visibilité conditionnelle Admin.

## Validation d'un sommet

Une entrée de `pendingDiscoveries` correspond à une détection produite par le
backend à partir d'une activité. L'utilisateur peut :

1. confirmer la détection avec le statut `CONFIRMED` ;
2. l'ignorer avec le statut `DISMISSED`.

La mutation appelle `PATCH /summits/discoveries/:discoveryId`. Une confirmation
fait entrer le sommet dans la collection lors du prochain rafraîchissement de
la requête. Le retrait utilise `DELETE /summits/:summitId/discovery`. Il retire
la découverte actuelle, mais n'empêche pas une prochaine activité de proposer
le sommet à nouveau.

## Endpoints utilisés

- `GET /summits`
- `GET /summits/badges` via le shell et le centre de notifications
- `PATCH /summits/discoveries/:discoveryId`
- `DELETE /summits/:summitId/discovery`
- `GET /activities`
- `GET /strava/status` via la sidebar
- endpoints de session utilisés par le client Axios partagé

Les contrats principaux sont documentés dans `types/` et `services/`.

## Données liées aux activités et à Strava

Chaque sommet peut exposer :

- la première activité associée ;
- la dernière activité associée ;
- le nombre de passages ;
- la distance de la trace la plus proche ;
- les détections en attente et leur confiance.

Les activités peuvent provenir de Strava ou d'une saisie existante. La page ne
connaît pas l'origine technique du token et n'en reçoit jamais la valeur.

## Réintégration dans HOVREN

1. Copier `route/page.tsx` vers `apps/web/app/sommets/page.tsx`.
2. Copier `route/sommets.module.css` dans le même dossier.
3. Restaurer les fichiers partagés uniquement si leur version courante n'est
   plus compatible.
4. Replacer les fichiers de `hooks/`, `services/`, `types/` et `stores/` dans
   leurs chemins indiqués par `MANIFEST.md`.
5. Restaurer `assets/sidebar-pine-forest.svg` dans `apps/web/public/images/`.
6. Installer les dépendances listées dans `package-dependencies.md`.
7. Déclarer `NEXT_PUBLIC_API_URL` à partir du modèle `.env.example`.
8. Vérifier que l'application fournit les providers TanStack Query, Sonner et
   Zustand déjà utilisés par HOVREN.
9. Lancer le typecheck, les tests et le build de l'application web.

## Réutilisation dans un autre projet

La route dépend du système d'alias `@/`, du shell HOVREN, des contrats API et
des routes `/activites/:id`. Pour une autre application :

- adapter les aliases TypeScript ;
- remplacer `DashboardLayout` par le shell cible ;
- adapter le client Axios et son mécanisme de session ;
- adapter les liens d'activité ;
- conserver les unions TypeScript de statut et les contrats de mutation ;
- remplacer les images externes de fallback par des assets contrôlés.

## Variables d'environnement

Seule la variable publique suivante est directement nécessaire au client API :

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Aucun secret backend, Strava, JWT, PostgreSQL ou Resend n'est requis dans cet
export.

## Dépendances spécifiques à HOVREN

- authentification persistée par `auth-store.ts` ;
- rafraîchissement de session dans `services/api.ts` ;
- shell, topbar et sidebar HOVREN ;
- routes `/sommets`, `/activites`, `/badges`, `/parametres` et `/admin` ;
- thème historique `sport-theme-nature` ;
- centre de notifications et moniteur de célébration.

## Limitations de l'export

- aucun backend NestJS ni schéma Prisma n'est inclus ;
- aucun catalogue de données réel n'est inclus ;
- aucune donnée personnelle n'est incluse ;
- les images fallback historiques sont des URL Pexels externes présentes dans
  le code de la route ;
- la page historique affiche un message global plutôt que des erreurs
  partielles ;
- elle utilise des balises `img` et non `next/image` pour ses cartes ;
- aucun test dédié à la route Sommets n'existait au moment de l'export ;
- les composants partagés sont des copies de compatibilité et peuvent contenir
  des fonctionnalités qui dépassent strictement la page Sommets.

## Contenu volontairement exclu

- fichiers `.env` réels ;
- secrets et tokens ;
- cookies et stockage navigateur ;
- données de production ;
- backend, Prisma et migrations ;
- `node_modules`, `.next`, caches et fichiers de build ;
- logs ;
- exports précédents du projet.

