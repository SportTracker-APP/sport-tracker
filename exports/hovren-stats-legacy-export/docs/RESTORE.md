# Restaurer la page historique

1. Sauvegarder la version courante de la route Statistiques.
2. Copier `route/page.tsx` vers `apps/web/app/statistiques/page.tsx`.
3. Copier `styles/statistiques.module.css` vers
   `apps/web/app/statistiques/statistiques.module.css`.
4. Vérifier que les fichiers partagés listés dans `MANIFEST.md` existent
   toujours dans le projet. Les copies de l'archive servent de référence si
   leur API a évolué.
5. Installer les dépendances listées dans `package-dependencies.md`.
6. Lancer le typecheck, les tests et le build du frontend.

La restauration n'exige aucune migration de base de données et ne modifie
aucun contrat backend.

