import { ActivityMailTimeService } from '../scheduling/activity-mail-time.service';
import type { MailConfig } from '../mail.types';

const config: MailConfig = {
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

describe('ActivityMailTimeService', () => {
  const service = new ActivityMailTimeService(config);

  it('schedules an 18:00 activity reminder three hours before', () => {
    const scheduledAt = service.calculateUpcomingReminderAt({
      activityStartsAt: new Date('2026-06-27T16:00:00.000Z'),
      now: new Date('2026-06-27T08:00:00.000Z'),
    });

    expect(scheduledAt?.toISOString()).toBe('2026-06-27T13:00:00.000Z');
  });

  it('schedules a 10:00 activity reminder at 07:00', () => {
    const scheduledAt = service.calculateUpcomingReminderAt({
      activityStartsAt: new Date('2026-06-27T08:00:00.000Z'),
      now: new Date('2026-06-26T18:00:00.000Z'),
    });

    expect(scheduledAt?.toISOString()).toBe('2026-06-27T05:00:00.000Z');
  });

  it('schedules a 09:00 activity reminder the previous day at 19:00', () => {
    const scheduledAt = service.calculateUpcomingReminderAt({
      activityStartsAt: new Date('2026-06-27T07:00:00.000Z'),
      now: new Date('2026-06-26T08:00:00.000Z'),
    });

    expect(scheduledAt?.toISOString()).toBe('2026-06-26T17:00:00.000Z');
  });

  it('schedules at the next worker pass when the theoretical reminder is past', () => {
    const now = new Date('2026-06-27T14:00:00.000Z');
    const scheduledAt = service.calculateUpcomingReminderAt({
      activityStartsAt: new Date('2026-06-27T16:00:00.000Z'),
      now,
    });

    expect(scheduledAt).toBe(now);
  });

  it('does not schedule when the activity starts in less than thirty minutes', () => {
    const scheduledAt = service.calculateUpcomingReminderAt({
      activityStartsAt: new Date('2026-06-27T16:00:00.000Z'),
      now: new Date('2026-06-27T15:40:00.000Z'),
    });

    expect(scheduledAt).toBeNull();
  });

  it('handles Europe/Paris winter offset', () => {
    const scheduledAt = service.calculateUpcomingReminderAt({
      activityStartsAt: new Date('2026-01-15T09:00:00.000Z'),
      now: new Date('2026-01-14T18:00:00.000Z'),
    });

    expect(scheduledAt?.toISOString()).toBe('2026-01-15T06:00:00.000Z');
  });

  it('handles daylight saving time changes', () => {
    const scheduledAt = service.calculateUpcomingReminderAt({
      activityStartsAt: new Date('2026-03-29T08:00:00.000Z'),
      now: new Date('2026-03-28T18:00:00.000Z'),
    });

    expect(scheduledAt?.toISOString()).toBe('2026-03-29T05:00:00.000Z');
  });

  it('schedules completed activity congratulations the next day at 09:00', () => {
    const scheduledAt = service.calculateCompletedCongratulationsAt({
      completedAt: new Date('2026-06-22T18:00:00.000Z'),
      now: new Date('2026-06-22T18:05:00.000Z'),
    });

    expect(scheduledAt?.toISOString()).toBe('2026-06-23T07:00:00.000Z');
  });

  it('does not schedule completed activity congratulations for old imports', () => {
    const scheduledAt = service.calculateCompletedCongratulationsAt({
      completedAt: new Date('2026-06-20T18:00:00.000Z'),
      now: new Date('2026-06-22T18:05:00.000Z'),
    });

    expect(scheduledAt).toBeNull();
  });
});
