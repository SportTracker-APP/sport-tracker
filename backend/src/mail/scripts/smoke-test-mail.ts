import 'dotenv/config';

import { createMailConfigFromEnv } from '../mail.config';
import { MailService } from '../mail.service';
import type { MailEnvValues } from '../mail.config';
import type { MailConfig } from '../mail.types';
import {
  createResendClient,
  ResendMailProvider,
} from '../providers/resend-mail.provider';

type MailSmokeType =
  | 'all'
  | 'auth.verify_email'
  | 'auth.welcome'
  | 'auth.reset_password'
  | 'auth.password_changed'
  | 'activity.first_created'
  | 'activity.upcoming_reminder'
  | 'activity.completed_congratulations'
  | 'summit.first_validated';

const mailSmokeTypes = [
  'all',
  'auth.verify_email',
  'auth.welcome',
  'auth.reset_password',
  'auth.password_changed',
  'activity.first_created',
  'activity.upcoming_reminder',
  'activity.completed_congratulations',
  'summit.first_validated',
] as const satisfies readonly MailSmokeType[];

async function runSmokeTest() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Mail smoke test cannot run in production');
  }

  const config = createMailConfigFromEnv(getMailEnvValues());

  if (!config.testRecipient) {
    throw new Error('MAIL_TEST_RECIPIENT is required for mail smoke test');
  }

  const resendClient = createResendClient(config);
  const mailProvider = new ResendMailProvider(config, resendClient);
  const mailService = new MailService(config, mailProvider);
  const smokeType = getMailSmokeType(process.env.MAIL_SMOKE_TYPE);
  const selectedTypes =
    smokeType === 'all'
      ? mailSmokeTypes.filter((type) => type !== 'all')
      : [smokeType];

  for (const selectedType of selectedTypes) {
    await sendSmokeEmail(mailService, config, selectedType);
  }
}

async function sendSmokeEmail(
  mailService: MailService,
  config: MailConfig,
  type: Exclude<MailSmokeType, 'all'>,
): Promise<void> {
  const smokeId = `local-smoke-${type}-${Date.now()}`;
  const recipient = config.testRecipient;

  if (!recipient) {
    throw new Error('MAIL_TEST_RECIPIENT is required for mail smoke test');
  }

  switch (type) {
    case 'auth.verify_email':
      await mailService.sendEmailVerification({
        to: recipient,
        userName: 'Camille',
        verifyUrl: buildUrl(config.appBaseUrl, '/verify-email?token=smoke-test'),
        expirationMinutes: 30,
        businessId: smokeId,
      });
      return;
    case 'auth.welcome':
      await mailService.sendWelcomeEmail({
        to: recipient,
        userName: 'Camille',
        businessId: smokeId,
      });
      return;
    case 'auth.reset_password':
      await mailService.sendPasswordResetEmail({
        to: recipient,
        userName: 'Camille',
        resetPasswordUrl: buildUrl(
          config.appBaseUrl,
          '/reset-password?token=smoke-test',
        ),
        expirationMinutes: 30,
        businessId: smokeId,
      });
      return;
    case 'auth.password_changed':
      await mailService.sendPasswordChangedEmail({
        to: recipient,
        userName: 'Camille',
        changedAt: '20 juillet 2026 à 10:30',
        deviceName: 'Appareil non précisé',
        location: 'Localisation non disponible',
        businessId: smokeId,
      });
      return;
    case 'activity.first_created':
      await mailService.sendFirstActivityCreatedEmail({
        to: recipient,
        userName: 'Camille',
        sportName: 'Trail',
        activityDate: '20 juillet 2026',
        activityName: 'Boucle du Mont Veyrier',
        distance: '12,4 km',
        duration: '1 h 42',
        elevationGain: '820 m',
        activityUrl: buildUrl(config.appBaseUrl, '/activites/smoke-test'),
        businessId: smokeId,
      });
      return;
    case 'activity.upcoming_reminder':
      await mailService.sendActivityUpcomingReminderEmail({
        to: recipient,
        userName: 'Camille',
        activityName: 'Sortie au col',
        sportName: 'Randonnée',
        activityDate: '21 juillet 2026',
        activityTime: '08:30',
        activityLocation: 'Annecy',
        activityUrl: buildUrl(config.appBaseUrl, '/calendrier'),
        businessId: smokeId,
      });
      return;
    case 'activity.completed_congratulations':
      await mailService.sendActivityCompletedCongratulationsEmail({
        to: recipient,
        userName: 'Camille',
        activityName: 'Trail Pointe de Talamarche',
        sportName: 'Trail',
        activityDate: '20 juillet 2026',
        distance: '15,8 km',
        duration: '2 h 15',
        elevationGain: '1 120 m',
        activityUrl: buildUrl(config.appBaseUrl, '/activites/smoke-test'),
        businessId: smokeId,
      });
      return;
    case 'summit.first_validated':
      await mailService.sendFirstSummitValidatedEmail({
        to: recipient,
        userName: 'Camille',
        summitDate: '20 juillet 2026',
        summitName: 'Pointe de Talamarche',
        summitAltitude: '1 852 m',
        routeDistance: '15,8 km',
        elevationGain: '1 120 m',
        summitUrl: buildUrl(config.appBaseUrl, '/sommets'),
        businessId: smokeId,
      });
      return;
  }
}

function getMailSmokeType(value: string | undefined): MailSmokeType {
  if (!value) {
    return 'auth.welcome';
  }

  if (isMailSmokeType(value)) {
    return value;
  }

  throw new Error(
    `MAIL_SMOKE_TYPE must be one of: ${mailSmokeTypes.join(', ')}`,
  );
}

function isMailSmokeType(value: string): value is MailSmokeType {
  return mailSmokeTypes.some((type) => type === value);
}

function buildUrl(baseUrl: string, path: string): string {
  return new URL(path, baseUrl).toString();
}

function getMailEnvValues(): MailEnvValues {
  return {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    MAIL_ENABLED: process.env.MAIL_ENABLED,
    MAIL_FROM: process.env.MAIL_FROM,
    MAIL_REPLY_TO: process.env.MAIL_REPLY_TO,
    MAIL_TEST_RECIPIENT: process.env.MAIL_TEST_RECIPIENT,
    APP_BASE_URL: process.env.APP_BASE_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,
    APP_DEFAULT_TIMEZONE: process.env.APP_DEFAULT_TIMEZONE,
    RESEND_TEMPLATE_AUTH_VERIFY: process.env.RESEND_TEMPLATE_AUTH_VERIFY,
    RESEND_TEMPLATE_AUTH_WELCOME: process.env.RESEND_TEMPLATE_AUTH_WELCOME,
    RESEND_TEMPLATE_AUTH_RESET_PASSWORD:
      process.env.RESEND_TEMPLATE_AUTH_RESET_PASSWORD,
    RESEND_TEMPLATE_AUTH_PASSWORD_CHANGED:
      process.env.RESEND_TEMPLATE_AUTH_PASSWORD_CHANGED,
    RESEND_TEMPLATE_ACTIVITY_FIRST_CREATED:
      process.env.RESEND_TEMPLATE_ACTIVITY_FIRST_CREATED,
    RESEND_ACTIVITY_UPCOMING_REMINDER_TEMPLATE_ID:
      process.env.RESEND_ACTIVITY_UPCOMING_REMINDER_TEMPLATE_ID,
    RESEND_ACTIVITY_COMPLETED_TEMPLATE_ID:
      process.env.RESEND_ACTIVITY_COMPLETED_TEMPLATE_ID,
    RESEND_TEMPLATE_SUMMIT_FIRST_VALIDATED:
      process.env.RESEND_TEMPLATE_SUMMIT_FIRST_VALIDATED,
  };
}

void runSmokeTest();
