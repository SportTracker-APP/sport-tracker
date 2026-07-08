export const MAIL_CONFIG = Symbol('MAIL_CONFIG');

export const MAIL_PROVIDER = Symbol('MAIL_PROVIDER');

export const RESEND_CLIENT = Symbol('RESEND_CLIENT');

export const MAIL_APP_NAME = 'Hovren';

export const MAIL_TEMPLATE_DEFAULTS = {
  authVerify: 'auth-verify-email',
  authWelcome: 'auth-welcome',
  authResetPassword: 'auth-reset-password',
  authPasswordChanged: 'auth-password-changed',
  activityFirstCreated: 'activity-first-created',
  activityUpcomingReminder: 'activity-upcoming-reminder',
  activityCompletedCongratulations: 'activity-completed-congratulations',
  summitFirstValidated: 'summit-first-validated',
} as const;
