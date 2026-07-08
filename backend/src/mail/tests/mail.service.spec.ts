import { MailProvider } from '../mail-provider.interface';
import { MailService } from '../mail.service';
import { MailConfig, MailSendRequest, MailSendResult } from '../mail.types';

const mailConfig: MailConfig = {
  enabled: true,
  apiKey: 'resend-api-key',
  from: 'Hovren <sender@example.test>',
  replyTo: 'support@example.test',
  appBaseUrl: 'http://localhost:3000',
  defaultTimezone: 'Europe/Paris',
  templates: {
    authVerify: 'auth-verify-email',
    authWelcome: 'auth-welcome',
    authResetPassword: 'auth-reset-password',
    authPasswordChanged: 'auth-password-changed',
    activityFirstCreated: 'activity-first-created',
    activityUpcomingReminder: 'activity-upcoming-reminder',
    activityCompletedCongratulations: 'activity-completed-congratulations',
    summitFirstValidated: 'summit-first-validated',
  },
};

function makeProvider() {
  return {
    sendTemplate: jest
      .fn<Promise<MailSendResult>, [MailSendRequest]>()
      .mockResolvedValue({ skipped: false, resendId: 'email-id' }),
  } satisfies MailProvider;
}

describe('MailService', () => {
  it('maps email verification data to the Resend template variables', async () => {
    const provider = makeProvider();
    const service = new MailService(mailConfig, provider);

    await service.sendEmailVerification({
      to: 'user@example.test',
      userName: 'Camille',
      verifyUrl: 'https://app.example.test/verify?token=secret-token',
      expirationMinutes: 30,
      businessId: 'verification-1',
    });

    const sentRequest = provider.sendTemplate.mock.calls[0]?.[0];

    expect(provider.sendTemplate).toHaveBeenCalledWith({
      type: 'auth.verify_email',
      to: 'user@example.test',
      templateId: 'auth-verify-email',
      businessId: 'verification-1',
      variables: expect.objectContaining({
        APP_NAME: 'Hovren',
        SUPPORT_EMAIL: 'support@example.test',
        USER_NAME: 'Camille',
        VERIFY_URL: 'https://app.example.test/verify?token=secret-token',
        EXPIRATION_MINUTES: 30,
      }),
    });
    expect(typeof sentRequest?.variables.CURRENT_YEAR).toBe('number');
  });

  it('maps welcome email data to the dashboard and Strava URLs', async () => {
    const provider = makeProvider();
    const service = new MailService(mailConfig, provider);

    await service.sendWelcomeEmail({
      to: 'user@example.test',
      userName: 'Camille',
    });

    expect(provider.sendTemplate).toHaveBeenCalledWith({
      type: 'auth.welcome',
      to: 'user@example.test',
      templateId: 'auth-welcome',
      businessId: undefined,
      variables: expect.objectContaining({
        USER_NAME: 'Camille',
        DASHBOARD_URL: 'http://localhost:3000/',
        STRAVA_CONNECT_URL: 'http://localhost:3000/integrations/strava',
      }),
    });
  });

  it('maps password reset data to the reset template variables', async () => {
    const provider = makeProvider();
    const service = new MailService(mailConfig, provider);

    await service.sendPasswordResetEmail({
      to: 'user@example.test',
      userName: 'Camille',
      resetPasswordUrl: 'https://app.example.test/reset?token=secret-token',
      expirationMinutes: 20,
      businessId: 'reset-1',
    });

    expect(provider.sendTemplate).toHaveBeenCalledWith({
      type: 'auth.reset_password',
      to: 'user@example.test',
      templateId: 'auth-reset-password',
      businessId: 'reset-1',
      variables: expect.objectContaining({
        USER_NAME: 'Camille',
        RESET_PASSWORD_URL: 'https://app.example.test/reset?token=secret-token',
        EXPIRATION_MINUTES: 20,
      }),
    });
  });

  it('maps password changed data to security template variables', async () => {
    const provider = makeProvider();
    const service = new MailService(mailConfig, provider);

    await service.sendPasswordChangedEmail({
      to: 'user@example.test',
      userName: 'Camille',
      changedAt: '24/06/2026 10:15',
      deviceName: 'Safari',
      location: 'France',
    });

    expect(provider.sendTemplate).toHaveBeenCalledWith({
      type: 'auth.password_changed',
      to: 'user@example.test',
      templateId: 'auth-password-changed',
      businessId: undefined,
      variables: expect.objectContaining({
        USER_NAME: 'Camille',
        CHANGED_AT: '24/06/2026 10:15',
        DEVICE_NAME: 'Safari',
        LOCATION: 'France',
        LOGIN_URL: 'http://localhost:3000/login',
        SECURITY_URL: 'http://localhost:3000/parametres',
      }),
    });
  });

  it('maps first activity created data to activity template variables', async () => {
    const provider = makeProvider();
    const service = new MailService(mailConfig, provider);

    await service.sendFirstActivityCreatedEmail({
      to: 'user@example.test',
      userName: 'Camille',
      sportName: 'Trail',
      activityDate: '24 juin 2026',
      activityName: 'Sortie longue',
      distance: '18 km',
      duration: '1 h 45',
      elevationGain: '650 m D+',
      activityUrl: 'http://localhost:3000/activites/activity-1',
      businessId: 'activity-1',
    });

    expect(provider.sendTemplate).toHaveBeenCalledWith({
      type: 'activity.first_created',
      to: 'user@example.test',
      templateId: 'activity-first-created',
      businessId: 'activity-1',
      variables: expect.objectContaining({
        USER_NAME: 'Camille',
        SPORT_NAME: 'Trail',
        ACTIVITY_DATE: '24 juin 2026',
        ACTIVITY_NAME: 'Sortie longue',
        DISTANCE: '18 km',
        DURATION: '1 h 45',
        ELEVATION_GAIN: '650 m D+',
        ACTIVITY_URL: 'http://localhost:3000/activites/activity-1',
        STATS_URL: 'http://localhost:3000/statistiques',
      }),
    });
  });

  it('maps first summit validated data to summit template variables', async () => {
    const provider = makeProvider();
    const service = new MailService(mailConfig, provider);

    await service.sendFirstSummitValidatedEmail({
      to: 'user@example.test',
      userName: 'Camille',
      summitDate: '24 juin 2026',
      summitName: 'Mont Aiguille',
      summitAltitude: '2 087 m',
      routeDistance: '12 km',
      elevationGain: '900 m D+',
      summitUrl: 'http://localhost:3000/sommets/summit-1',
    });

    expect(provider.sendTemplate).toHaveBeenCalledWith({
      type: 'summit.first_validated',
      to: 'user@example.test',
      templateId: 'summit-first-validated',
      businessId: undefined,
      variables: expect.objectContaining({
        USER_NAME: 'Camille',
        SUMMIT_DATE: '24 juin 2026',
        SUMMIT_NAME: 'Mont Aiguille',
        SUMMIT_ALTITUDE: '2 087 m',
        ROUTE_DISTANCE: '12 km',
        ELEVATION_GAIN: '900 m D+',
        SUMMIT_URL: 'http://localhost:3000/sommets/summit-1',
        SUMMITS_URL: 'http://localhost:3000/sommets',
      }),
    });
  });

  it('maps upcoming activity reminder data to activity template variables', async () => {
    const provider = makeProvider();
    const service = new MailService(mailConfig, provider);

    await service.sendActivityUpcomingReminderEmail({
      to: 'user@example.test',
      userName: 'Camille',
      activityName: 'Sortie longue',
      sportName: 'Trail',
      activityDate: 'samedi 27 juin 2026',
      activityTime: '08:30',
      activityLocation: 'Annecy, France',
      activityUrl: 'http://localhost:3000/activites/activity-1',
      businessId: 'scheduled-email-1',
    });

    expect(provider.sendTemplate).toHaveBeenCalledWith({
      type: 'activity.upcoming_reminder',
      to: 'user@example.test',
      templateId: 'activity-upcoming-reminder',
      businessId: 'scheduled-email-1',
      variables: expect.objectContaining({
        USER_NAME: 'Camille',
        ACTIVITY_NAME: 'Sortie longue',
        SPORT_NAME: 'Trail',
        ACTIVITY_DATE: 'samedi 27 juin 2026',
        ACTIVITY_TIME: '08:30',
        ACTIVITY_LOCATION: 'Annecy, France',
        ACTIVITY_URL: 'http://localhost:3000/activites/activity-1',
      }),
    });
  });

  it('maps completed activity congratulations data to activity template variables', async () => {
    const provider = makeProvider();
    const service = new MailService(mailConfig, provider);

    await service.sendActivityCompletedCongratulationsEmail({
      to: 'user@example.test',
      userName: 'Camille',
      activityName: 'Sortie longue',
      sportName: 'Trail',
      activityDate: 'samedi 27 juin 2026',
      distance: '12,4 km',
      duration: '1 h 42',
      elevationGain: '640 m D+',
      activityUrl: 'http://localhost:3000/activites/activity-1',
      businessId: 'scheduled-email-2',
    });

    expect(provider.sendTemplate).toHaveBeenCalledWith({
      type: 'activity.completed_congratulations',
      to: 'user@example.test',
      templateId: 'activity-completed-congratulations',
      businessId: 'scheduled-email-2',
      variables: expect.objectContaining({
        USER_NAME: 'Camille',
        ACTIVITY_NAME: 'Sortie longue',
        SPORT_NAME: 'Trail',
        ACTIVITY_DATE: 'samedi 27 juin 2026',
        DISTANCE: '12,4 km',
        DURATION: '1 h 42',
        ELEVATION_GAIN: '640 m D+',
        ACTIVITY_URL: 'http://localhost:3000/activites/activity-1',
      }),
    });
  });
});
