import type { MailEmailType } from './mail.types';

export type MailTemplateDefinition = {
  fileName: string;
  variables: readonly string[];
};

export const MAIL_TEMPLATE_CATALOG: Record<
  MailEmailType,
  MailTemplateDefinition
> = {
  'auth.verify_email': {
    fileName: 'auth-verify-email.html',
    variables: [
      'APP_NAME',
      'SUPPORT_EMAIL',
      'CURRENT_YEAR',
      'USER_NAME',
      'VERIFY_URL',
      'EXPIRATION_MINUTES',
    ],
  },
  'auth.welcome': {
    fileName: 'auth-welcome.html',
    variables: [
      'APP_NAME',
      'SUPPORT_EMAIL',
      'CURRENT_YEAR',
      'USER_NAME',
      'DASHBOARD_URL',
      'STRAVA_CONNECT_URL',
    ],
  },
  'auth.reset_password': {
    fileName: 'auth-reset-password.html',
    variables: [
      'APP_NAME',
      'SUPPORT_EMAIL',
      'CURRENT_YEAR',
      'USER_NAME',
      'RESET_PASSWORD_URL',
      'EXPIRATION_MINUTES',
    ],
  },
  'auth.password_changed': {
    fileName: 'auth-password-changed.html',
    variables: [
      'APP_NAME',
      'SUPPORT_EMAIL',
      'CURRENT_YEAR',
      'USER_NAME',
      'CHANGED_AT',
      'DEVICE_NAME',
      'LOCATION',
      'LOGIN_URL',
      'SECURITY_URL',
    ],
  },
  'activity.first_created': {
    fileName: 'activity-first-created.html',
    variables: [
      'APP_NAME',
      'SUPPORT_EMAIL',
      'CURRENT_YEAR',
      'USER_NAME',
      'SPORT_NAME',
      'ACTIVITY_DATE',
      'ACTIVITY_NAME',
      'DISTANCE',
      'DURATION',
      'ELEVATION_GAIN',
      'ACTIVITY_URL',
      'STATS_URL',
    ],
  },
  'activity.upcoming_reminder': {
    fileName: 'activity-upcoming-reminder.html',
    variables: [
      'APP_NAME',
      'SUPPORT_EMAIL',
      'CURRENT_YEAR',
      'USER_NAME',
      'ACTIVITY_NAME',
      'SPORT_NAME',
      'ACTIVITY_DATE',
      'ACTIVITY_TIME',
      'ACTIVITY_LOCATION',
      'ACTIVITY_URL',
    ],
  },
  'activity.completed_congratulations': {
    fileName: 'activity-completed-congratulations.html',
    variables: [
      'APP_NAME',
      'SUPPORT_EMAIL',
      'CURRENT_YEAR',
      'USER_NAME',
      'ACTIVITY_NAME',
      'SPORT_NAME',
      'ACTIVITY_DATE',
      'DISTANCE',
      'DURATION',
      'ELEVATION_GAIN',
      'ACTIVITY_URL',
    ],
  },
  'summit.first_validated': {
    fileName: 'summit-first-validated.html',
    variables: [
      'APP_NAME',
      'SUPPORT_EMAIL',
      'CURRENT_YEAR',
      'USER_NAME',
      'SUMMIT_DATE',
      'SUMMIT_NAME',
      'SUMMIT_ALTITUDE',
      'ROUTE_DISTANCE',
      'ELEVATION_GAIN',
      'SUMMIT_URL',
      'SUMMITS_URL',
    ],
  },
};
