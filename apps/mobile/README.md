# HOVREN Mobile

Socle iPhone natif de HOVREN, construit avec Expo, React Native et Expo Router.
Cette application reste séparée de `apps/web` et partage à terme le backend NestJS
existant sans embarquer le site dans une WebView.

## Commandes

Depuis la racine du dépôt :

```bash
npm run dev:mobile
npm run check:mobile
```

Depuis ce dossier :

```bash
npm run ios
npm run start:dev-client
npm run start:dev-client:tunnel
npm run typecheck
npm run lint
npm run doctor
```

## Organisation

- `app/` : onboarding, routes d’authentification protégées, onglets principaux et
  stack secondaire ;
- `src/api/` : client HTTP avec Bearer token et reprise automatique après `401` ;
- `src/auth/` : session globale, stockage sécurisé et préparation OAuth ;
- `src/onboarding/` : état de première ouverture, non sensible, dans AsyncStorage ;
- `src/config/` : validation de la configuration publique Expo ;
- `src/components/` : primitives mobiles réutilisables ;
- `src/theme/` : tokens visuels HOVREN.

## Configuration API

Copie `env.local.example` vers `.env.local`, puis adapte l’URL au contexte de
développement. `localhost` fonctionne dans le simulateur iOS ; un iPhone physique
doit utiliser une URL de développement accessible depuis l’appareil.

```bash
cp env.local.example .env.local
```

Deux valeurs publiques sont disponibles :

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_WEB_URL=http://localhost:3000
```

`EXPO_PUBLIC_API_URL` cible l’API NestJS. `EXPO_PUBLIC_WEB_URL` sert uniquement à
ouvrir le parcours web existant « Mot de passe oublié ». Ces valeurs sont intégrées
à l’application et ne doivent donc contenir aucun secret. Les builds hors
développement refusent une URL non HTTPS.

Dans Expo Go sur un iPhone physique, remplace `localhost` dans ces deux URLs par
l’adresse IP locale du Mac, par exemple `http://192.168.1.20:4000`. L’iPhone et le
Mac doivent être sur le même réseau.

## Session native

L’access token reste uniquement en mémoire. Le refresh token rotatif est conservé
par Expo SecureStore dans le trousseau natif et n’est jamais écrit dans
AsyncStorage. Au lancement, le provider d’authentification échange ce refresh token
contre une nouvelle session. Une réponse `401` déclenche un seul refresh partagé,
puis rejoue la requête une fois.

## Expérience d’entrée

Le splash natif reste affiché pendant la restauration de session et la lecture du
marqueur d’onboarding. À la première ouverture, trois pages présentent HOVREN ;
leur achèvement est mémorisé dans AsyncStorage, car cette donnée n’est pas sensible.
Une session valide ouvre directement les onglets. Sinon, l’application affiche les
écrans Connexion et Inscription.

L’inscription utilise l’endpoint web existant et conserve sa vérification d’email :
le lien reçu s’ouvre dans le navigateur, puis l’utilisateur revient se connecter
dans l’application. Le reset de mot de passe ouvre lui aussi le parcours web
existant. Apple et Google sont présentés comme indisponibles tant que leurs flux
OAuth natifs ne sont pas branchés.

## Lancement et tests

Depuis la racine, démarre l’API puis Expo dans deux terminaux :

```bash
npm run dev:backend
npm run dev:mobile
```

Scanne le QR code avec Expo Go pour tester sur un appareil physique. Pour le
simulateur iOS, utilise `npm --prefix apps/mobile run ios`, ou appuie sur `i` dans
le terminal Expo. Le splash natif final doit être contrôlé dans un build de
développement ou de production : Expo Go n’en reproduit pas fidèlement le rendu.

## Écrans connectés

Le Refuge ouvre maintenant le contenu sélectionné : fiche sommet dans Explorer,
détail de sortie dans Carnet, ou section Progression pour les objectifs.

- Explorer utilise `GET /summits` : recherche par nom, alias et massif, filtres de
  découverte, massif et altitude, tri, et fiche en panneau modal natif. La position
  du sommet s’ouvre dans Plans sur iOS ou Google Maps sur Android ; aucune carte
  intégrée ni permission de localisation n’est ajoutée dans cette étape.
- Carnet réutilise les ressources et calculs du Refuge (`/activities`, `/summits`,
  `/goals`, `/summits/badges`). Les sorties réellement enregistrées sont classées
  par mois, recherchables et filtrables par sport. La section Progression présente
  les sommets, objectifs actifs et badges débloqués.
- Les listes prévoient chargement, absence de données, erreur, et actualisation
  manuelle. Une actualisation échouée conserve les données déjà chargées en mémoire.
- Les routes `/explore?summit=ID`, `/journal?activity=ID` et
  `/journal?section=progress` restent derrière la protection de session existante.

### Ajout manuel d’une sortie

L’onglet central Ajouter enregistre une sortie terminée via `POST /activities`.
Le sport, la date/heure locale et la durée sont renseignés dans un formulaire
mobile ; titre, distance, dénivelé, lieu et notes restent facultatifs. Le calendrier
et le sélecteur de sport utilisent les composants natifs déjà disponibles, sans
nouvelle dépendance. Les dates futures, dates impossibles et valeurs invalides
sont refusées avant l’envoi, puis le backend conserve ses propres validations.

`duration` est exprimée en **minutes** dans l’API actuelle (formulaire web et import
Strava), `distance` en kilomètres et `elevationGain` en mètres. L’affichage du Carnet
et les objectifs de durée utilisent les mêmes unités. La date locale est convertie
en ISO UTC à l’envoi. Les mesures laissées vides sont omises.

Une confirmation ouvre la sortie créée. Un signal d’invalidation sans données
personnelles recharge Carnet, Refuge et Explorer après l’enregistrement. Le
formulaire reste en mémoire lors d’un changement d’onglet et est effacé à la
déconnexion. Les doubles appuis sont bloqués ; un envoi réseau non confirmé invite
à vérifier le Carnet avant une nouvelle tentative, sans renvoi automatique du POST
(seule la reprise après `401` du client authentifié existant est conservée).

Les notes sont accessibles dans la fiche de sortie. Ce parcours n’enregistre pas
de trace GPS et ne crée pas de découverte de sommet côté client.

Les exports `RefugeView`, `ExploreView` et `JournalView` séparent présentation et
chargement. Aucun preview, fixture de présentation ou contournement de session
n’est branché à l’application. Les tests de modèles se lancent avec `npm test`
(Node 22.22 ou plus récent). Les changements de cette étape n’ajoutent aucune
dépendance native et peuvent être chargés par Metro dans la development build
existante.

## Development Build iOS avec EAS

Le profil `development` de `eas.json` crée une application de développement pour
un iPhone physique avec distribution interne. Son Bundle Identifier est
`fr.hovren.app` et le scheme applicatif reste `hovren://`.

Le projet ne contient volontairement ni identifiant de projet EAS, ni credential
Apple, ni certificat. Après connexion à ton propre compte Expo, initialise le lien
EAS puis enregistre l’iPhone avant de demander la première build :

```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile development
```

Une fois la build installée, le travail quotidien ne demande pas de rebuild pour
les changements JavaScript, TypeScript ou d’assets :

```bash
npm run start:dev-client
```

Si le réseau local bloque Metro, utilise le tunnel fourni localement par
`@expo/ngrok` :

```bash
npm run start:dev-client:tunnel
```

Le tunnel expose Metro, pas l’API locale. Dans ce cas, l’iPhone doit toujours
pouvoir joindre `EXPO_PUBLIC_API_URL`, par exemple via une API de développement
HTTPS accessible. Une nouvelle build EAS est nécessaire après un changement de
dépendance native, de plugin Expo, de Bundle Identifier, de permissions ou de
configuration native dans `app.json`.
