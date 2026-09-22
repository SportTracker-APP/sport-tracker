# Catalogue Concors — sélection initiale

Cette première extension HOVREN hors Haute-Savoie et Savoie reste volontairement
ciblée sur le massif du Concors au sens strict. Elle ne confond pas ce massif avec
le périmètre plus large du Grand Site de France Concors Sainte-Victoire.

## Entrées publiées

| Identifiant | Nom HOVREN | Alias principaux | Altitude | Coordonnées (lon, lat) | Type |
| --- | --- | --- | ---: | --- | --- |
| `vigie-de-marinas` | Vigie de Marinas | Vigie de Meyrargues, Tour de guet de Marinas | 498 m | 5.5429654, 43.6264690 | Belvédère |
| `le-concors` | Le Concors | Concors, Sommet du Concors, Montagne de Concors | 782 m | 5.6141699, 43.5945673 | Sommet |

## Sources et arbitrages

- Le [plan officiel de Meyrargues](https://www.meyrargues.fr/wp-content/uploads/2023/06/MEYRARGUES-PLAN-2023.pdf)
  nomme la « Vigie de Marinas » et indique la tour de guet à 498 m. « Vigie de
  Meyrargues » est conservé comme alias d'usage.
- Le [Département des Bouches-du-Rhône](https://departement13.fr/vivre-en-provence/redecouvrir-la-provence/idees-de-balades/en-vadrouille/massif-du-concors-domaine)
  donne 782 m pour le sommet du Concors et le décrit comme le point culminant du
  massif.
- Les positions reprennent les objets OpenStreetMap vérifiés de la tour de
  Marinas et du sommet du Concors. L'ordre des coordonnées respecte le contrat
  HOVREN : longitude, puis latitude.
- Les Ubacs et la Vautubière appartiennent au Grand Site élargi et restent hors
  de cette sélection initiale pour ne pas les attribuer à tort au massif strict.

## Photo

Le Concors utilise `Montagne de Concors.jpg`, photographie de Gundan sous licence
CC BY-SA 4.0, [page source Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Montagne_de_Concors.jpg).
La conversion WebP est redimensionnée et compressée, sans retouche éditoriale.

La Vigie de Marinas utilise temporairement une photographie issue de la fiche
Decathlon Outdoor « Vigie Meyrargues ». La source est conservée dans les crédits
afin de faciliter son remplacement par une photographie HOVREN ou librement
licenciée.

## Backlog admin prioritaire

- [ ] Depuis le formulaire de création d'un sommet, permettre soit de
  sélectionner un massif existant, soit d'en créer un sans quitter le flux.
  La création doit demander au minimum son nom, son type `MASSIF`, son parent
  géographique et son état de publication, puis sélectionner automatiquement
  le nouveau massif comme massif principal du sommet. Ce point est un prérequis
  aux prochains catalogues hors 74/73.
