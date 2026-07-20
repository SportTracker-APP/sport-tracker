import { Logger } from '@nestjs/common';
import {
  CreateEmailOptions,
  CreateEmailRequestOptions,
  CreateEmailResponse,
} from 'resend';

import { MailConfig, MailSendRequest } from '../mail.types';
import {
  maskEmailAddress,
  ResendEmailClient,
  ResendMailProvider,
} from '../providers/resend-mail.provider';

type ResendEmailClientMock = {
  emails: {
    send: jest.Mock<
      ReturnType<ResendEmailClient['emails']['send']>,
      [CreateEmailOptions, CreateEmailRequestOptions?]
    >;
  };
};

const enabledConfig: MailConfig = {
  enabled: true,
  apiKey: 'resend-api-key',
  from: 'Hovren <sender@example.test>',
  replyTo: 'contact@hovren.fr',
  appBaseUrl: 'http://localhost:3000',
  defaultTimezone: 'Europe/Paris',
  templates: {
    authVerify: 'auth-verify-email',
    authWelcome: 'auth-welcome',
    authResetPassword: 'auth-reset-password',
    authPasswordChanged: 'auth-password-changed',
    activityFirstCreated: 'activity-first-created',
    activityUpcomingReminder: 'activity-upcoming-reminder',
    activityCompletedCongratulations: 'activity-completed',
    summitFirstValidated: 'summit-first-validated',
  },
};

const request: MailSendRequest = {
  type: 'auth.verify_email',
  to: 'camille@example.test',
  templateId: 'auth-verify-email',
  businessId: 'user-1',
  variables: {
    VERIFY_URL: 'https://app.example.test/verify?token=secret-token',
    USER_NAME: 'Camille',
  },
};

function makeResendMock(): ResendEmailClientMock {
  const response = {
    data: { id: 'resend-email-1' },
    error: null,
    headers: null,
  } satisfies CreateEmailResponse;

  return {
    emails: {
      send: jest.fn().mockResolvedValue(response),
    },
  };
}

describe('ResendMailProvider', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not call Resend when mail is disabled', async () => {
    const resend = makeResendMock();
    const provider = new ResendMailProvider(
      { ...enabledConfig, enabled: false },
      resend,
    );

    const result = await provider.sendTemplate(request);

    expect(result).toEqual({ skipped: true });
    expect(resend.emails.send).not.toHaveBeenCalled();
  });

  it('sends template emails through Resend with an idempotency key', async () => {
    const resend = makeResendMock();
    const provider = new ResendMailProvider(enabledConfig, resend);

    const result = await provider.sendTemplate(request);

    expect(result).toEqual({ skipped: false, resendId: 'resend-email-1' });
    expect(resend.emails.send).toHaveBeenCalledWith(
      {
        from: 'Hovren <sender@example.test>',
        to: 'camille@example.test',
        replyTo: 'contact@hovren.fr',
        template: {
          id: 'auth-verify-email',
          variables: request.variables,
        },
      },
      {
        idempotencyKey: 'sport-tracker:auth.verify_email:user-1',
      },
    );
  });

  it('does not add an idempotency key without a business id', async () => {
    const resend = makeResendMock();
    const provider = new ResendMailProvider(enabledConfig, resend);

    await provider.sendTemplate({ ...request, businessId: undefined });

    expect(resend.emails.send.mock.calls[0]?.[1]).toBeUndefined();
  });

  it('logs only sanitized context when Resend fails', async () => {
    const resend = makeResendMock();
    resend.emails.send.mockResolvedValueOnce({
      data: null,
      error: {
        name: 'validation_error',
        message: 'Bad request with token secret-token and resend-api-key',
        statusCode: 422,
      },
      headers: null,
    } satisfies CreateEmailResponse);
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const provider = new ResendMailProvider(enabledConfig, resend);

    await expect(provider.sendTemplate(request)).rejects.toThrow(
      'Transactional email failed',
    );

    expect(errorSpy).toHaveBeenCalledWith({
      emailType: 'auth.verify_email',
      recipient: 'ca***@example.test',
      resendErrorName: 'validation_error',
      resendStatusCode: 422,
      message: 'Transactional email failed',
    });
    expect(errorSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({
        VERIFY_URL: expect.stringContaining('token'),
      }),
    );
  });

  it('masks email addresses for logs', () => {
    expect(maskEmailAddress('a@example.test')).toBe('a***@example.test');
    expect(maskEmailAddress('al@example.test')).toBe('al***@example.test');
    expect(maskEmailAddress('alice@example.test')).toBe('al***@example.test');
    expect(maskEmailAddress('not-an-email')).toBe('***');
  });
});
