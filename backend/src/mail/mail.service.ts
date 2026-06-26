import { Inject, Injectable } from '@nestjs/common';

import { MAIL_APP_NAME, MAIL_CONFIG, MAIL_PROVIDER } from './mail.constants';
import type { MailProvider } from './mail-provider.interface';
import type {
  EmailVerificationMailInput,
  ActivityCompletedCongratulationsMailInput,
  ActivityUpcomingReminderMailInput,
  FirstActivityCreatedMailInput,
  FirstSummitValidatedMailInput,
  MailConfig,
  MailSendResult,
  PasswordChangedMailInput,
  PasswordResetMailInput,
  WelcomeMailInput,
} from './mail.types';

@Injectable()
export class MailService {
  constructor(
    @Inject(MAIL_CONFIG) private readonly config: MailConfig,
    @Inject(MAIL_PROVIDER) private readonly provider: MailProvider,
  ) {}

  sendEmailVerification(
    input: EmailVerificationMailInput,
  ): Promise<MailSendResult> {
    return this.provider.sendTemplate({
      type: 'auth.verify_email',
      to: input.to,
      templateId: this.config.templates.authVerify,
      businessId: input.businessId,
      variables: {
        ...this.commonVariables(),
        USER_NAME: input.userName,
        VERIFY_URL: input.verifyUrl,
        EXPIRATION_MINUTES: input.expirationMinutes,
      },
    });
  }

  sendWelcomeEmail(input: WelcomeMailInput): Promise<MailSendResult> {
    return this.provider.sendTemplate({
      type: 'auth.welcome',
      to: input.to,
      templateId: this.config.templates.authWelcome,
      businessId: input.businessId,
      variables: {
        ...this.commonVariables(),
        USER_NAME: input.userName,
        DASHBOARD_URL: this.buildAppUrl('/'),
        STRAVA_CONNECT_URL: this.buildAppUrl('/integrations/strava'),
      },
    });
  }

  sendPasswordResetEmail(
    input: PasswordResetMailInput,
  ): Promise<MailSendResult> {
    return this.provider.sendTemplate({
      type: 'auth.reset_password',
      to: input.to,
      templateId: this.config.templates.authResetPassword,
      businessId: input.businessId,
      variables: {
        ...this.commonVariables(),
        USER_NAME: input.userName,
        RESET_PASSWORD_URL: input.resetPasswordUrl,
        EXPIRATION_MINUTES: input.expirationMinutes,
      },
    });
  }

  sendPasswordChangedEmail(
    input: PasswordChangedMailInput,
  ): Promise<MailSendResult> {
    return this.provider.sendTemplate({
      type: 'auth.password_changed',
      to: input.to,
      templateId: this.config.templates.authPasswordChanged,
      businessId: input.businessId,
      variables: {
        ...this.commonVariables(),
        USER_NAME: input.userName,
        CHANGED_AT: input.changedAt,
        DEVICE_NAME: input.deviceName,
        LOCATION: input.location,
        LOGIN_URL: this.buildAppUrl('/login'),
        SECURITY_URL: this.buildAppUrl('/parametres'),
      },
    });
  }

  sendFirstActivityCreatedEmail(
    input: FirstActivityCreatedMailInput,
  ): Promise<MailSendResult> {
    return this.provider.sendTemplate({
      type: 'activity.first_created',
      to: input.to,
      templateId: this.config.templates.activityFirstCreated,
      businessId: input.businessId,
      variables: {
        ...this.commonVariables(),
        USER_NAME: input.userName,
        SPORT_NAME: input.sportName,
        ACTIVITY_DATE: input.activityDate,
        ACTIVITY_NAME: input.activityName,
        DISTANCE: input.distance,
        DURATION: input.duration,
        ELEVATION_GAIN: input.elevationGain,
        ACTIVITY_URL: input.activityUrl,
        STATS_URL: this.buildAppUrl('/statistiques'),
      },
    });
  }

  sendActivityUpcomingReminderEmail(
    input: ActivityUpcomingReminderMailInput,
  ): Promise<MailSendResult> {
    return this.provider.sendTemplate({
      type: 'activity.upcoming_reminder',
      to: input.to,
      templateId: this.config.templates.activityUpcomingReminder,
      businessId: input.businessId,
      variables: {
        ...this.commonVariables(),
        USER_NAME: input.userName,
        ACTIVITY_NAME: input.activityName,
        SPORT_NAME: input.sportName,
        ACTIVITY_DATE: input.activityDate,
        ACTIVITY_TIME: input.activityTime,
        ACTIVITY_LOCATION: input.activityLocation,
        ACTIVITY_URL: input.activityUrl,
      },
    });
  }

  sendActivityCompletedCongratulationsEmail(
    input: ActivityCompletedCongratulationsMailInput,
  ): Promise<MailSendResult> {
    return this.provider.sendTemplate({
      type: 'activity.completed_congratulations',
      to: input.to,
      templateId: this.config.templates.activityCompletedCongratulations,
      businessId: input.businessId,
      variables: {
        ...this.commonVariables(),
        USER_NAME: input.userName,
        ACTIVITY_NAME: input.activityName,
        SPORT_NAME: input.sportName,
        ACTIVITY_DATE: input.activityDate,
        DISTANCE: input.distance,
        DURATION: input.duration,
        ELEVATION_GAIN: input.elevationGain,
        ACTIVITY_URL: input.activityUrl,
      },
    });
  }

  sendFirstSummitValidatedEmail(
    input: FirstSummitValidatedMailInput,
  ): Promise<MailSendResult> {
    return this.provider.sendTemplate({
      type: 'summit.first_validated',
      to: input.to,
      templateId: this.config.templates.summitFirstValidated,
      businessId: input.businessId,
      variables: {
        ...this.commonVariables(),
        USER_NAME: input.userName,
        SUMMIT_DATE: input.summitDate,
        SUMMIT_NAME: input.summitName,
        SUMMIT_ALTITUDE: input.summitAltitude,
        ROUTE_DISTANCE: input.routeDistance,
        ELEVATION_GAIN: input.elevationGain,
        SUMMIT_URL: input.summitUrl,
        SUMMITS_URL: this.buildAppUrl('/sommets'),
      },
    });
  }

  private commonVariables() {
    return {
      APP_NAME: MAIL_APP_NAME,
      SUPPORT_EMAIL: this.config.replyTo ?? this.extractEmail(this.config.from),
      CURRENT_YEAR: new Date().getFullYear(),
    };
  }

  private buildAppUrl(path: string): string {
    return new URL(path, this.config.appBaseUrl).toString();
  }

  private extractEmail(value: string): string {
    const match = value.match(/<([^>]+)>/);

    return match?.[1] ?? value;
  }
}
