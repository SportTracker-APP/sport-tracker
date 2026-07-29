# Audit SEO HOVREN - 29 juillet 2026

## Perimetre

Cet audit couvre uniquement le site public Next.js accessible sur
`https://hovren.fr`. Il ne modifie ni le backend, ni l'authentification, ni les
donnees sportives, ni les pages applicatives qui n'ont pas encore ete
refondues.

## Inventaire d'indexation

Pages publiques a indexer :

- `/`
- `/conditions`
- `/confidentialite`

Pages publiques utilitaires a ne pas indexer :

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify-email`

Toutes les routes de l'application authentifiee doivent rester hors de
l'index, notamment :

- `/refuge`
- `/sommets`
- `/activites` et `/activites/*`
- `/admin`
- `/badges`
- `/calendrier`
- `/carte`
- `/integrations/*`
- `/journal`
- `/objectifs`
- `/parametres`
- `/performances`
- `/statistiques`

Les routes internes `/landing-page-v1` et `/theme-lab` doivent egalement
rester hors de l'index.

## Constat avant correction

| Niveau   | Probleme                           | Constat                                                                                                                 |
| -------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Critique | Indexation globale trop permissive | Le layout racine publie `index, follow`, y compris sur les pages privees.                                               |
| Critique | Protection HTTP absente            | Les routes privees ne renvoient pas de header `X-Robots-Tag`.                                                           |
| Eleve    | Metadata legales incompletes       | Conditions et Confidentialite n'ont ni canonical explicite, ni Open Graph, ni Twitter Card, ni directive robots locale. |
| Moyen    | Sitemap instable                   | `lastModified: new Date()` annonce artificiellement une modification de toutes les pages a chaque generation.           |
| Moyen    | Configuration dispersee            | URL, titres, descriptions et images sociales sont dupliques entre plusieurs fichiers.                                   |
| Faible   | Donnees structurees perfectibles   | Le nom de site est present, mais les entites WebSite et Organization ne sont pas reliees par des identifiants stables.  |
| Faible   | Search Console non configurable    | Aucun emplacement n'est prevu pour la balise de verification Google.                                                    |

## Points deja conformes

- la landing repond en HTTP 200 et son contenu principal est rendu cote
  serveur ;
- la landing contient un H1 unique et descriptif ;
- la balise `lang="fr"` est presente ;
- les images Open Graph et Twitter existent en 1200 x 630 et sont accessibles
  publiquement ;
- le sitemap ne liste que les trois pages reellement publiques ;
- la landing contient deja un vocabulaire coherent autour des sorties, traces,
  sommets, massifs, badges, progression, randonnee, trail et synchronisation
  Strava ;
- le manifest et les icones HOVREN sont presents ;
- aucune ancienne marque publique n'a ete detectee sur la landing actuelle.

## Strategie de correction

1. rendre le layout racine non indexable par defaut ;
2. rendre explicitement indexables uniquement la landing et les deux pages
   legales ;
3. ajouter un `X-Robots-Tag` aux routes privees, d'authentification et
   internes ;
4. conserver les routes crawlables afin que les moteurs puissent lire leur
   directive `noindex` ;
5. centraliser les constantes SEO et les metadata publiques ;
6. stabiliser le sitemap sans fausses dates ;
7. renforcer les donnees structurees WebSite, Organization et
   SoftwareApplication ;
8. permettre la verification Search Console via
   `GOOGLE_SITE_VERIFICATION`.

## Validation attendue

- une page publique expose `index, follow`, une canonical absolue et les
  metadata sociales HOVREN ;
- une page privee expose `noindex, nofollow` dans le HTML et dans les headers
  HTTP ;
- `/sitemap.xml` ne contient que les trois URL publiques ;
- `/robots.txt` indique le sitemap et laisse les robots lire les directives
  `noindex` ;
- le typecheck, les tests SEO et le build de production passent.

## Mise en ligne et Google Search Console

Apres deploiement de cette version :

1. ajouter une propriete de domaine `hovren.fr` dans Google Search Console ;
2. copier l'enregistrement TXT fourni par Google dans la zone DNS Cloudflare ;
3. valider la propriete dans Search Console ;
4. soumettre `https://hovren.fr/sitemap.xml` dans la rubrique Sitemaps ;
5. inspecter `https://hovren.fr`, puis demander son indexation ;
6. verifier que l'URL canonique selectionnee par Google est
   `https://hovren.fr` ;
7. surveiller les rapports Pages, HTTPS et Core Web Vitals apres le prochain
   crawl.

Une verification par balise HTML reste possible sans modifier le code :
declarer `GOOGLE_SITE_VERIFICATION` dans l'environnement Vercel avec uniquement
la valeur du jeton fourni par Google, puis redeployer.

## Controle apres deploiement

Les URL suivantes doivent repondre publiquement :

- `https://hovren.fr/robots.txt`
- `https://hovren.fr/sitemap.xml`
- `https://hovren.fr/opengraph-image.png`
- `https://hovren.fr/twitter-image.png`

La landing doit exposer une canonical vers `https://hovren.fr` et une directive
`index, follow`. Les routes d'authentification et de l'application doivent
exposer `noindex, nofollow`, ainsi qu'un header HTTP `X-Robots-Tag`.
