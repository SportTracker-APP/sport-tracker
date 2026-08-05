# PROMPT CODEX — Intégration des emails HOVREN basés sur le template validé

Tu travailles sur le dépôt actuel de HOVREN.

Six templates HTML refondus viennent d’être ajoutés. Ils reprennent volontairement et précisément la structure visuelle du template déjà validé :

`auth-reset-password-resend.html`

La référence visuelle contient notamment :

- la barre terracotta de 6 px ;
- l’image topographique publique en haut ;
- le fond général beige `#ebe6da` ;
- la carte principale crème `#f8f4e9` ;
- le vert HOVREN `#19382d` ;
- l’accent terracotta `#cf5b3a` ;
- le même header de marque ;
- le même badge de statut ;
- le même style de titre ;
- le même type d’encart ;
- le même CTA ;
- le même footer ;
- le même responsive mobile ;
- la même structure email-safe en tableaux ;
- la même syntaxe de variables en triples accolades : `{{{VARIABLE}}}`.

## Fichiers concernés

- `activity-first-created-resend.html`
- `activity-upcoming-reminder-resend.html`
- `auth-password-changed-resend.html`
- `auth-verify-email-resend.html`
- `auth-welcome-resend-v2-strava.html`
- `summit-first-validated-resend.html`

## Règle absolue : ne pas refaire le design

Le design est déjà validé.

Ne modifie pas :

- la structure visuelle ;
- la palette ;
- l’image ;
- les espacements ;
- le style du header ;
- les titres ;
- le footer ;
- les CTA ;
- la syntaxe des variables ;

sauf correction technique indispensable et explicitement justifiée.

## Image publique à conserver

Tous les templates utilisent exactement cette image :

`https://hovren.fr/email-assets/hovren-email-activity-ascent.jpg`

Le fichier correspondant existe déjà dans le projet public.

Vérifie dans le dépôt que l’asset est réellement présent à un chemin équivalent à :

`apps/web/public/email-assets/hovren-email-activity-ascent.jpg`

ou au chemin public réel du frontend actuel.

Ne crée pas une nouvelle image.

Ne renomme pas l’image.

Ne change pas son URL sans nécessité.

Vérifie après déploiement que cette URL renvoie bien un statut HTTP 200 et le bon type MIME.

## Source de vérité

Le dépôt actuellement ouvert est la seule source de vérité.

Ne te base pas sur :

- un ancien Drive ;
- une ancienne archive ;
- une ancienne branche ;
- une ancienne description du projet ;
- une hypothèse sur Resend.

Commence par auditer le système mail existant.

## Audit obligatoire

Inspecte notamment :

- `MailModule` ;
- `MailService` ;
- le provider Resend ;
- le moteur de rendu des templates ;
- les helpers de remplacement des variables ;
- les template IDs éventuels ;
- les variables d’environnement ;
- les événements déclenchant chaque email ;
- les tests existants ;
- le comportement lorsque `MAIL_ENABLED=false`.

Détermine si la source de vérité actuelle est :

- le HTML local ;
- un template distant Resend ;
- ou un système hybride.

Évite d’entretenir deux versions divergentes.

## Syntaxe des variables

Les nouveaux fichiers utilisent la même syntaxe que le template de mot de passe oublié validé :

```text
{{{APP_NAME}}}
{{{USER_NAME}}}
{{{RESET_PASSWORD_URL}}}
```

Vérifie le moteur réel du projet.

S’il utilise Mustache ou Handlebars, les triples accolades signifient généralement un rendu non échappé.

Ne modifie pas aveuglément cette syntaxe.

Tu dois :

1. comprendre le renderer actuel ;
2. confirmer pourquoi le template reset fonctionne ;
3. faire utiliser exactement la même stratégie aux six nouveaux templates ;
4. garantir que les valeurs textuelles utilisateur restent échappées avant injection ;
5. garantir que les URL restent valides ;
6. empêcher tout placeholder non résolu d’être envoyé.

Aucun email ne doit partir avec une variable visible telle que :

```text
{{{APP_NAME}}}
{{{USER_NAME}}}
{{{ACTIVITY_NAME}}}
```

## Correspondance des variables

### activity-first-created-resend.html

- `APP_NAME`
- `USER_NAME`
- `ACTIVITY_NAME`
- `SPORT_NAME`
- `ACTIVITY_DATE`
- `DISTANCE`
- `DURATION`
- `ELEVATION_GAIN`
- `ACTIVITY_URL`
- `STATS_URL`
- `SUPPORT_EMAIL`
- `CURRENT_YEAR`

### activity-upcoming-reminder-resend.html

- `APP_NAME`
- `USER_NAME`
- `ACTIVITY_NAME`
- `SPORT_NAME`
- `ACTIVITY_DATE`
- `ACTIVITY_TIME`
- `ACTIVITY_LOCATION`
- `ACTIVITY_URL`
- `SUPPORT_EMAIL`
- `CURRENT_YEAR`

### auth-password-changed-resend.html

- `APP_NAME`
- `USER_NAME`
- `CHANGED_AT`
- `DEVICE_NAME`
- `LOCATION`
- `LOGIN_URL`
- `SECURITY_URL`
- `SUPPORT_EMAIL`
- `CURRENT_YEAR`

### auth-verify-email-resend.html

- `APP_NAME`
- `USER_NAME`
- `VERIFY_URL`
- `EXPIRATION_MINUTES`
- `SUPPORT_EMAIL`
- `CURRENT_YEAR`

### auth-welcome-resend-v2-strava.html

- `APP_NAME`
- `USER_NAME`
- `STRAVA_CONNECT_URL`
- `DASHBOARD_URL`
- `SUPPORT_EMAIL`
- `CURRENT_YEAR`

### summit-first-validated-resend.html

- `APP_NAME`
- `USER_NAME`
- `SUMMIT_NAME`
- `SUMMIT_DATE`
- `SUMMIT_ALTITUDE`
- `ROUTE_DISTANCE`
- `ELEVATION_GAIN`
- `SUMMIT_URL`
- `SUMMITS_URL`
- `SUPPORT_EMAIL`
- `CURRENT_YEAR`

## Événements à vérifier

Vérifie la correspondance exacte :

- inscription → vérification email ;
- vérification réussie → bienvenue ;
- changement de mot de passe → confirmation ;
- première sortie créée → email de première sortie ;
- séance planifiée approchant → rappel ;
- premier sommet validé → email de premier sommet.

Ne change pas les règles métier existantes sans nécessité.

## Valeurs obligatoires et fallbacks

Aucun email ne doit contenir :

- `undefined` ;
- `null` ;
- `NaN` ;
- `Invalid Date` ;
- une URL vide ;
- un placeholder non remplacé.

Prévois des fallbacks propres pour les données éventuellement absentes :

- appareil ;
- localisation ;
- lieu ;
- dénivelé ;
- distance ;
- altitude ;
- heure.

Ne crée pas de fausse donnée.

## Sécurité

Les triples accolades ne doivent pas permettre une injection HTML.

Échappe ou normalise explicitement les valeurs provenant d’une saisie utilisateur :

- prénom ;
- nom d’activité ;
- nom de sommet ;
- lieu ;
- localisation.

Teste notamment avec :

```text
<script>alert("xss")</script>
```

Le contenu doit être affiché comme du texte et jamais exécuté.

Ne logue jamais :

- la clé Resend ;
- un mot de passe ;
- un token complet ;
- le HTML complet contenant des données sensibles.

## URLs

Vérifie que toutes les URL sont :

- absolues ;
- en HTTPS en production ;
- basées sur le domaine réel ;
- compatibles avec les routes actuelles ;
- sans `localhost` en production ;
- sans concaténation incorrecte ;
- testées depuis l’email reçu.

Contrôle notamment :

- `VERIFY_URL`
- `LOGIN_URL`
- `SECURITY_URL`
- `ACTIVITY_URL`
- `STATS_URL`
- `STRAVA_CONNECT_URL`
- `DASHBOARD_URL`
- `SUMMIT_URL`
- `SUMMITS_URL`

## Tests automatisés obligatoires

Ajoute ou mets à jour les tests pour vérifier :

1. le chargement des six templates ;
2. leur utilisation par le bon événement ;
3. le remplacement de toutes les triples accolades ;
4. l’absence de placeholder restant ;
5. l’échappement des valeurs utilisateur ;
6. les URL absolues ;
7. les fallbacks ;
8. l’absence de `undefined`, `null`, `NaN` et `Invalid Date` ;
9. le comportement lorsque `MAIL_ENABLED=false` ;
10. le comportement lorsque Resend échoue ;
11. l’absence d’initialisation de Resend sans clé lorsque les mails sont désactivés ;
12. l’unicité des emails “première sortie”, “premier sommet” et “welcome”.

## Tests visuels et réels

Lorsque la configuration le permet, envoie un exemplaire réel de chaque email vers une adresse de test.

Vérifie :

- l’image topographique ;
- le nom HOVREN ;
- le badge de statut ;
- le titre ;
- les variables ;
- le CTA ;
- le lien de secours lorsqu’il existe ;
- le footer ;
- le responsive mobile ;
- l’absence de placeholder ;
- les liens ;
- le sujet ;
- le `from` ;
- le `reply-to`.

Teste au minimum :

- Gmail desktop ;
- Gmail mobile ;
- Apple Mail ;
- Outlook web ;
- une largeur mobile proche de 375 px.

Si un test réel ne peut pas être réalisé, indique-le honnêtement.

## Resend

Si le projet utilise des templates distants Resend :

- identifie les IDs réellement utilisés ;
- mets à jour les bons templates si l’accès le permet ;
- conserve les fichiers locaux comme référence versionnée ;
- documente toute action manuelle ;
- ne prétends pas avoir modifié Resend sans action réelle.

Si le projet envoie le HTML local directement, confirme que les nouveaux fichiers sont bien chargés en production.

## Commandes de validation

Exécute les scripts réels du dépôt :

- typecheck backend ;
- lint backend ;
- tests du module mail ;
- tests des modules déclencheurs ;
- build backend.

Utilise les commandes `pnpm --filter` réellement configurées si nécessaire.

## Critères d’acceptation

La mission est validée si :

1. les six templates utilisent exactement la DA du reset password validé ;
2. la même image publique apparaît dans les six emails ;
3. l’asset public renvoie bien HTTP 200 après déploiement ;
4. chaque événement utilise le bon fichier ;
5. toutes les variables sont remplacées ;
6. aucun placeholder n’est envoyé ;
7. aucune valeur invalide n’est visible ;
8. les valeurs utilisateur sont sécurisées ;
9. tous les CTA fonctionnent ;
10. le responsive est correct ;
11. les tests passent ;
12. le backend compile ;
13. aucune logique métier non concernée n’a régressé ;
14. les éventuelles étapes manuelles Resend sont documentées.

## Livrable final

Fournis :

1. l’audit du système actuel ;
2. la source de vérité retenue ;
3. les fichiers modifiés ;
4. la correspondance événement → template ;
5. la correspondance variable → valeur backend ;
6. la confirmation de la présence de l’asset public ;
7. le résultat du test HTTP de l’image ;
8. les tests ajoutés ;
9. les commandes exécutées ;
10. les emails réellement envoyés ;
11. les clients contrôlés ;
12. les actions manuelles Resend restantes ;
13. les limites éventuelles.

Ne redesign pas les templates.

Le but est uniquement de les intégrer, de les sécuriser et de prouver qu’ils fonctionnent.
