import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

const genericForgotPasswordMessage =
  'Si un compte correspond à cette adresse, un email de réinitialisation a été envoyé.';
const registerMessage =
  'Compte créé. Vérifiez votre boîte mail pour activer votre compte.';

describe('Authentication API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const registeredEmail = `e2e-${Date.now()}@example.test`;
  const testPassword = `Test1-${randomBytes(16).toString('hex')}`;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET ??= randomBytes(32).toString('hex');
    process.env.JWT_REFRESH_SECRET ??= randomBytes(32).toString('hex');
    process.env.STRAVA_STATE_SECRET ??= randomBytes(32).toString('hex');
    process.env.STRAVA_TOKEN_ENCRYPTION_KEYS ??=
      randomBytes(32).toString('base64');
    process.env.STRAVA_CLIENT_SECRET ??= randomBytes(32).toString('hex');
    process.env.SUPABASE_URL ??= 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY ??= randomBytes(32).toString('hex');
    process.env.MAIL_ENABLED = 'false';
    process.env.APP_BASE_URL ??= 'http://localhost:3000';
    process.env.FRONTEND_URL ??= 'http://localhost:3000';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: registeredEmail } });
    await app.close();
  });

  it('expose les sondes de vie et de disponibilité', async () => {
    const live = await request(app.getHttpServer()).get('/health/live').expect(200);
    expect(live.body).toMatchObject({
      status: 'ok',
      service: 'montara-backend',
    });

    const ready = await request(app.getHttpServer()).get('/health/ready').expect(200);
    expect(ready.body).toMatchObject({
      status: 'ok',
      info: { database: { status: 'up' } },
    });
  });

  it('retourne la réponse générique pour une adresse inconnue', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: `unknown-${Date.now()}@example.test` })
      .expect(201);

    expect(response.body).toEqual({ message: genericForgotPasswordMessage });
  });

  it('applique la validation de production aux inscriptions', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        firstName: 'A',
        email: 'not-an-email',
        password: 'x',
        unexpected: true,
      })
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining([
        'property unexpected should not exist',
        'firstName must be longer than or equal to 2 characters',
        'email must be an email',
      ]),
    );
  });

  it('crée un compte non vérifié et refuse sa connexion', async () => {
    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        firstName: 'Camille',
        email: registeredEmail.toUpperCase(),
        password: testPassword,
      })
      .expect(201);

    expect(registration.body).toEqual({ message: registerMessage });

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: registeredEmail },
      include: { emailVerificationTokens: true },
    });

    expect(user.emailVerifiedAt).toBeNull();
    expect(user.emailVerificationTokens).toHaveLength(1);
    expect(user.emailVerificationTokens[0]?.tokenHash).toHaveLength(64);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: registeredEmail, password: testPassword })
      .expect(401);
  });
});
