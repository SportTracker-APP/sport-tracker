import { Inject, Injectable } from '@nestjs/common';

import { MAIL_CONFIG } from '../mail.constants';
import type { MailConfig } from '../mail.types';

const REMINDER_MINIMUM_LEAD_TIME_MS = 30 * 60 * 1000;
const COMPLETED_EMAIL_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

@Injectable()
export class ActivityMailTimeService {
  constructor(@Inject(MAIL_CONFIG) private readonly config: MailConfig) {}

  getDefaultTimezone(): string {
    return this.config.defaultTimezone;
  }

  calculateUpcomingReminderAt(input: {
    activityStartsAt: Date;
    timezone?: string;
    now?: Date;
  }): Date | null {
    const now = input.now ?? new Date();
    const timezone = input.timezone ?? this.config.defaultTimezone;

    if (input.activityStartsAt.getTime() <= now.getTime()) {
      return null;
    }

    const startParts = getZonedDateParts(input.activityStartsAt, timezone);
    const reminderLocal =
      startParts.hour >= 10
        ? {
            ...startParts,
            hour: startParts.hour - 3,
            minute: startParts.minute,
            second: 0,
          }
        : getPreviousDayAt(startParts, 19, 0);

    const theoreticalReminderAt = zonedDateTimeToUtc(reminderLocal, timezone);

    if (theoreticalReminderAt.getTime() > now.getTime()) {
      return theoreticalReminderAt;
    }

    const startsInMs = input.activityStartsAt.getTime() - now.getTime();

    if (startsInMs > REMINDER_MINIMUM_LEAD_TIME_MS) {
      return now;
    }

    return null;
  }

  calculateCompletedCongratulationsAt(input: {
    completedAt: Date;
    timezone?: string;
    now?: Date;
  }): Date | null {
    const now = input.now ?? new Date();

    if (
      now.getTime() - input.completedAt.getTime() >
      COMPLETED_EMAIL_MAX_AGE_MS
    ) {
      return null;
    }

    const timezone = input.timezone ?? this.config.defaultTimezone;
    const completedParts = getZonedDateParts(input.completedAt, timezone);
    const nextDay = getRelativeDayAt(completedParts, 1, 9, 0);

    return zonedDateTimeToUtc(nextDay, timezone);
  }
}

export function getZonedDateParts(
  date: Date,
  timezone: string,
): ZonedDateParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter
    .formatToParts(date)
    .reduce<Partial<ZonedDateParts>>((accumulator, part) => {
      if (
        part.type === 'year' ||
        part.type === 'month' ||
        part.type === 'day' ||
        part.type === 'hour' ||
        part.type === 'minute' ||
        part.type === 'second'
      ) {
        accumulator[part.type] = Number(part.value);
      }

      return accumulator;
    }, {});

  if (
    parts.year === undefined ||
    parts.month === undefined ||
    parts.day === undefined ||
    parts.hour === undefined ||
    parts.minute === undefined ||
    parts.second === undefined
  ) {
    throw new Error(`Unable to read date parts for timezone ${timezone}`);
  }

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

export function zonedDateTimeToUtc(
  localDateTime: ZonedDateParts,
  timezone: string,
): Date {
  let utcTimestamp = Date.UTC(
    localDateTime.year,
    localDateTime.month - 1,
    localDateTime.day,
    localDateTime.hour,
    localDateTime.minute,
    localDateTime.second,
  );

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const offset = getTimezoneOffsetMs(new Date(utcTimestamp), timezone);
    utcTimestamp =
      Date.UTC(
        localDateTime.year,
        localDateTime.month - 1,
        localDateTime.day,
        localDateTime.hour,
        localDateTime.minute,
        localDateTime.second,
      ) - offset;
  }

  return new Date(utcTimestamp);
}

function getTimezoneOffsetMs(date: Date, timezone: string): number {
  const parts = getZonedDateParts(date, timezone);

  return (
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ) - date.getTime()
  );
}

function getPreviousDayAt(
  parts: ZonedDateParts,
  hour: number,
  minute: number,
): ZonedDateParts {
  return getRelativeDayAt(parts, -1, hour, minute);
}

function getRelativeDayAt(
  parts: ZonedDateParts,
  dayOffset: number,
  hour: number,
  minute: number,
): ZonedDateParts {
  const shiftedDate = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + dayOffset),
  );

  return {
    year: shiftedDate.getUTCFullYear(),
    month: shiftedDate.getUTCMonth() + 1,
    day: shiftedDate.getUTCDate(),
    hour,
    minute,
    second: 0,
  };
}
