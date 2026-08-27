<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Observability

- `GET /health/live` verifies that the API process is running.
- `GET /health/ready` verifies that the API and PostgreSQL are ready.
- `GET /health` is a database-free liveness alias. Use `/health/live` as the
  Render health-check path so monitoring does not keep a serverless database
  awake.
- `GET /metrics` exposes Prometheus metrics and requires `Authorization: Bearer <METRICS_TOKEN>`.
- Sentry is enabled only when `SENTRY_DSN` is configured.
- Sanitized HTTP 5xx alerts are sent when `ALERTS_ENABLED=true` and `ALERT_WEBHOOK_URL` is configured.

Request bodies, authentication headers, cookies, query strings and user details are excluded from observability payloads.

## Curation des photos de sommets

`pnpm summits:photos --report=/tmp/summit-photos.json` prépare un rapport sans
modifier la base. Le premier niveau retient uniquement les images Wikimedia
Commons reliées à une entité Wikidata cohérente en nom, coordonnées et
altitude. Pour les sommets restants, une recherche exacte Commons exige à la
fois le nom dans le fichier, une catégorie correspondant précisément au sommet
et une prise de vue géolocalisée à moins de 75 km.

Le rapport doit être relu visuellement avant application. Les fichiers qui
respectent les métadonnées mais ne représentent pas clairement le sommet sont
explicitement exclus de la curation.

Pour figer exactement la sélection relue, l’application accepte
`--approved-report=<rapport> --expected-candidates=<nombre>` avec `--apply`.
Le fichier est revalidé (domaines Wikimedia, licence, crédit, unicité) avant la
transaction afin que l’ordre variable des résultats Commons ne change pas la
sélection approuvée.

Le pipeline refuse les licences non commerciales ou sans dérivés, exige un
auteur et conserve sur chaque sommet le crédit, la licence et la page source
Commons. L’application est idempotente et ne remplace jamais une photo
existante ou ajoutée manuellement dans le back-office. Une base distante exige
les confirmations explicites affichées par la commande avant tout `--apply`.

## Strava token encryption

Strava access and refresh tokens are encrypted at rest with AES-256-GCM. Configure one base64-encoded 32-byte key:

```bash
openssl rand -base64 32
```

Store the result in `STRAVA_TOKEN_ENCRYPTION_KEYS`. Existing plaintext tokens are encrypted automatically when the backend starts. Production startup fails when this setting is missing.

To rotate the key, configure `STRAVA_TOKEN_ENCRYPTION_KEYS=new-key,previous-key`, deploy every backend instance, then remove the previous key after all instances have completed startup. Never commit these keys.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
