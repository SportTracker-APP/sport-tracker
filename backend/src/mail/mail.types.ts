export type MailEmailType =
  | 'auth.verify_email'
  | 'auth.welcome'
  | 'auth.reset_password'
  | 'auth.password_changed'
  | 'activity.first_created'
  | 'activity.upcoming_reminder'
  | 'activity.completed_congratulations'
  | 'summit.first_validated';

export type MailTemplateVariables = Record<string, string | number>;

export type MailConfig = {
  enabled: boolean;
  apiKey?: string;
  from: string;
  replyTo?: string;
  testRecipient?: string;
  appBaseUrl: string;
  defaultTimezone: string;
};

export type MailSendRequest = {
  type: MailEmailType;
  to: string;
  variables: MailTemplateVariables;
  businessId?: string;
};

export type MailSendResult =
  | {
      skipped: true;
      resendId?: never;
    }
  | {
      skipped: false;
      resendId: string;
    };

export type EmailVerificationMailInput = {
  to: string;
  userName: string;
  verifyUrl: string;
  expirationMinutes: number;
  businessId?: string;
};

export type WelcomeMailInput = {
  to: string;
  userName: string;
  businessId?: string;
};

export type PasswordResetMailInput = {
  to: string;
  userName: string;
  resetPasswordUrl: string;
  expirationMinutes: number;
  businessId?: string;
};

export type PasswordChangedMailInput = {
  to: string;
  userName: string;
  changedAt: string;
  deviceName: string;
  location: string;
  businessId?: string;
};

export type FirstActivityCreatedMailInput = {
  to: string;
  userName: string;
  sportName: string;
  activityDate: string;
  activityName: string;
  distance: string;
  duration: string;
  elevationGain: string;
  activityUrl: string;
  businessId?: string;
};

export type ActivityUpcomingReminderMailInput = {
  to: string;
  userName: string;
  activityName: string;
  sportName: string;
  activityDate: string;
  activityTime: string;
  activityLocation: string;
  activityUrl: string;
  businessId?: string;
};

export type ActivityCompletedCongratulationsMailInput = {
  to: string;
  userName: string;
  activityName: string;
  sportName: string;
  activityDate: string;
  distance: string;
  duration: string;
  elevationGain: string;
  activityUrl: string;
  businessId?: string;
};

export type FirstSummitValidatedMailInput = {
  to: string;
  userName: string;
  summitDate: string;
  summitName: string;
  summitAltitude: string;
  routeDistance: string;
  elevationGain: string;
  summitUrl: string;
  businessId?: string;
};
