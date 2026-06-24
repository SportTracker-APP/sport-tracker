export type MailTemplateKey =
  | 'authVerify'
  | 'authWelcome'
  | 'authResetPassword'
  | 'authPasswordChanged'
  | 'activityFirstCreated'
  | 'summitFirstValidated';

export type MailEmailType =
  | 'auth.verify_email'
  | 'auth.welcome'
  | 'auth.reset_password'
  | 'auth.password_changed'
  | 'activity.first_created'
  | 'summit.first_validated';

export type MailTemplateVariables = Record<string, string | number>;

export type MailTemplatesConfig = Record<MailTemplateKey, string>;

export type MailConfig = {
  enabled: boolean;
  apiKey?: string;
  from: string;
  replyTo?: string;
  testRecipient?: string;
  appBaseUrl: string;
  templates: MailTemplatesConfig;
};

export type MailSendRequest = {
  type: MailEmailType;
  to: string;
  templateId: string;
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
