# Emails transactionnels HOVREN

## Source de vérité

Les fichiers HTML de `src/mail/templates` sont l'unique source de vérité des
emails transactionnels. `MailTemplateRenderer` vérifie les variables, échappe
les valeurs dynamiques, valide les URL absolues et produit le HTML final envoyé
directement à l'API Resend.

Les templates distants du dashboard Resend ne sont plus utilisés par le code.
Ils peuvent être archivés dans Resend après le déploiement de cette version.

## Emails et déclencheurs

| Type | Template local | Déclencheur actuel |
| --- | --- | --- |
| `auth.verify_email` | `auth-verify-email.html` | Création ou renvoi de vérification |
| `auth.welcome` | `auth-welcome.html` | Validation de l'adresse email |
| `auth.reset_password` | `auth-reset-password.html` | Demande de réinitialisation |
| `auth.password_changed` | `auth-password-changed.html` | Réinitialisation réussie |
| `activity.first_created` | `activity-first-created.html` | Prêt à l'emploi, volontairement non branché faute de déclencheur métier fiable |
| `activity.upcoming_reminder` | `activity-upcoming-reminder.html` | Scheduler des activités planifiées |
| `activity.completed_congratulations` | `activity-completed-congratulations.html` | Worker des activités terminées |
| `summit.first_validated` | `summit-first-validated.html` | Première découverte de sommet validée |

## Sécurité de rendu

Un email n'est jamais envoyé lorsque :

- une variable attendue manque ;
- une variable inconnue est fournie ;
- un placeholder est mal formé ou non remplacé ;
- une variable se terminant par `_URL` n'est pas une URL HTTP(S) absolue ;
- le template ne contient pas de sujet dans sa balise `<title>`.

Les erreurs de rendu et d'envoi sont journalisées avec uniquement le type
d'email et le destinataire masqué. Aucun contenu, token ou clé API n'est loggé.

## Configuration

Variables nécessaires :

```env
RESEND_API_KEY=
MAIL_ENABLED=false
MAIL_FROM=HOVREN - Ton carnet outdoor <noreply@hovren.fr>
MAIL_REPLY_TO=contact@hovren.fr
MAIL_TEST_RECIPIENT=recipient@example.test
MAIL_SMOKE_TYPE=auth.welcome
APP_BASE_URL=http://localhost:3000
APP_DEFAULT_TIMEZONE=Europe/Paris
```

`MAIL_ENABLED=false` désactive réellement les appels à Resend. Les anciennes
variables `RESEND_TEMPLATE_*` ne sont plus nécessaires.

## Smoke test hors production

Le test réel exige explicitement `MAIL_TEST_RECIPIENT`, refuse
`NODE_ENV=production` et respecte `MAIL_ENABLED` :

```bash
MAIL_SMOKE_TYPE=all npm run mail:smoke
```

Pour tester un seul email, utiliser son type, par exemple
`MAIL_SMOKE_TYPE=auth.verify_email`.
