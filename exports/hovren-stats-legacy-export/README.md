# HOVREN Stats Legacy Export

Sauvegarde de la page Statistiques HOVREN avant sa refonte éditoriale.

## Contenu

- route Next.js App Router historique ;
- styles propres à la page et styles Dashboard partagés ;
- layout applicatif utilisé par la route ;
- sélecteur de période ;
- hook TanStack Query des activités ;
- service et type `Activity` ;
- calcul des périodes et test unitaire associé ;
- documentation d'audit et de restauration.

## Dépendances

La page a été exportée depuis une application Next.js 16 / React 19 en
TypeScript strict. Les dépendances directes sont documentées dans
`package-dependencies.md`.

## Données et environnement

La page appelle uniquement `GET /activities` au travers du client API partagé
du projet. Le client API et la configuration d'authentification ne sont pas
dupliqués dans cette archive afin d'éviter d'exporter une configuration
spécifique ou sensible.

Pour une réutilisation hors HOVREN, fournir un client HTTP authentifié et
adapter l'import `@/lib/api` utilisé par `services/activities.ts`.

## Restauration

Consulter `docs/RESTORE.md`. La restauration remplace la route et son module
CSS, puis requiert que les dépendances partagées listées dans le manifeste
soient présentes à leurs emplacements d'origine.

## Exclusions volontaires

- fichiers `.env` et secrets ;
- `node_modules`, `.next`, caches et artefacts de build ;
- client API et logique JWT ;
- composants globaux non spécifiques à Statistiques ;
- backend NestJS, Prisma et base de données.

