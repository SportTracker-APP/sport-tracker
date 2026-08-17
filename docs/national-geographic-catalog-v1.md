# Catalogue géographique national V1

## Modèle

`GeoArea` représente tout territoire géographique utile à HOVREN. Son `type`
distingue notamment pays, région administrative, département, chaîne de
montagnes, massif, sous-massif, secteur et parc naturel. Sa relation
`parent` / `children` forme une hiérarchie souple : aucun couple de types
parent/enfant n’est imposé dans le code.

`SummitGeoArea` est la relation explicite plusieurs-à-plusieurs entre un sommet
et ses territoires. Sa clé composée `(summitId, geoAreaId)` empêche les
doublons. `Summit.primaryMassifId` désigne séparément le massif principal.
Le service métier n’accepte qu’une zone de type `MASSIF` et garantit que cette
zone, ainsi que ses ancêtres, sont aussi associées au sommet.

Le champ historique `Summit.massif` est conservé pendant la transition. Il
reste alimenté avec le nom du massif principal afin que les écrans actuels et
les anciens clients API continuent de fonctionner. Il ne doit plus servir à
construire de nouvelles règles géographiques.

## Hiérarchie initiale et publication

Le référentiel commence par :

```text
France
├── Alpes
│   ├── Alpes du Nord
│   │   ├── Mont-Blanc
│   │   ├── Bauges
│   │   ├── Aravis
│   │   ├── Vanoise
│   │   ├── Chartreuse
│   │   └── massifs historiques HOVREN
│   └── Alpes du Sud
├── Pyrénées
├── Jura
├── Vosges
├── Massif central
└── Corse
```

Une zone sans catalogue exploitable peut être créée avec
`isPublished = false`. Les endpoints utilisateur ne retournent par défaut que
les zones publiées. Les sommets continuent d’utiliser `isActive` comme statut
de publication public existant.

Exemple actuel :

```text
Mont Veyrier
├── France
├── Alpes
├── Alpes du Nord
└── Annecy (massif principal historique)
```

## Migration et seed

La migration `20260817100000_create_national_geo_catalog` est additive :

1. elle crée les nouveaux modèles et enums ;
2. elle insère les zones aux identifiants et slugs stables ;
3. elle transforme chaque massif historique en `GeoArea` ;
4. elle associe chaque sommet à son massif et à tous ses ancêtres ;
5. elle définit le massif principal sans supprimer le champ legacy, les
   sommets ou les découvertes utilisateur.

Le seed se lance avec `npm run db:seed` depuis `backend`. Il repose sur des
`upsert`, des slugs stables et `skipDuplicates`; il peut donc être rejoué. Un
libellé historique inconnu est conservé dans une zone déterministe plutôt que
d’être perdu.

## API et filtrage

- `GET /geo-areas?type=MASSIF&parentId=...&published=true`
- `GET /geo-areas/:slug`
- `GET /summits?geoAreaId=...&includeDescendants=true`

Le filtre descendant charge la hiérarchie publiée en une requête, calcule les
identifiants descendants en mémoire, puis interroge les sommets en une requête.
Il n’effectue pas de récursion N+1.

## Préférences utilisateur

`UserGeoAreaPreference` prépare `HOME_AREA`, `FAVORITE` et `DISCOVERY`. La
contrainte `(userId, geoAreaId, type)` interdit les doublons. Aucune API de
personnalisation ni limite de favoris n’est activée dans cette V1 : ces données
ne filtrent donc jamais silencieusement le catalogue global.

## Exploration et imports futurs

Exploration reçoit les sommets actifs via l’API et les rend dans une source
GeoJSON Mapbox. Les sommets non découverts utilisent un style discret et leur
nom n’apparaît qu’au zoom rapproché, avec la gestion native des collisions.
Toutes les traces GPS éligibles sont affichées ; chaque polyligne est
simplifiée avant son ajout à la source pour protéger les performances.

Un futur import national devra alimenter `GeoArea`, `Summit` et
`SummitGeoArea` après normalisation et déduplication. Il ne devra pas ajouter
de branche métier dédiée à une chaîne ou une ville : ajouter les Pyrénées doit
rester principalement un ajout de données.

## Contrôle avant le back-office

La migration a été validée dans un schéma PostgreSQL temporaire avec un sommet,
une activité et une découverte historiques. Le schéma a été supprimé après le
test. La migration, le double seed, les tests métier, les typechecks, les builds
et la recette Exploration/Sommets/Sorties passent.

La Phase B n’est pas incluse dans ce lot car le lint global du dépôt possède une
dette antérieure au catalogue géographique (règles React, typage de tests et
formatage dans des fichiers sans rapport avec cette migration). Les fichiers
créés ou modifiés par la Phase A passent leur lint ciblé. Il faut soit traiter
ce nettoyage dans un lot séparé, soit décider explicitement que ce passif ne
bloque pas le démarrage du back-office.
