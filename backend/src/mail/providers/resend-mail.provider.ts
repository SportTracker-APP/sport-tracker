import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  CreateEmailOptions,
  CreateEmailRequestOptions,
  CreateEmailResponse,
} from 'resend';
import { Resend } from 'resend';

import { MAIL_CONFIG, RESEND_CLIENT } from '../mail.constants';
import type { MailProvider } from '../mail-provider.interface';
import {
  MailTemplateRenderer,
  type RenderedMailTemplate,
} from '../mail-template.renderer';
import type {
  MailConfig,
  MailSendRequest,
  MailSendResult,
} from '../mail.types';

export type ResendEmailClient = {
  emails: {
    send: (
      payload: CreateEmailOptions,
      options?: CreateEmailRequestOptions,
    ) => Promise<CreateEmailResponse>;
  };
};

@Injectable()
export class ResendMailProvider implements MailProvider {
  private readonly logger = new Logger(ResendMailProvider.name);

  constructor(
    @Inject(MAIL_CONFIG) private readonly config: MailConfig,
    @Inject(RESEND_CLIENT) private readonly resend: ResendEmailClient,
    private readonly renderer: MailTemplateRenderer,
  ) {}

  async sendTemplate(request: MailSendRequest): Promise<MailSendResult> {
    const logContext = this.getLogContext(request);

    if (!this.config.enabled) {
      this.logger.log({
        ...logContext,
        message: 'Transactional email skipped because mail is disabled',
      });

      return { skipped: true };
    }

    let renderedTemplate: RenderedMailTemplate;

    try {
      renderedTemplate = await this.renderer.render(
        request.type,
        request.variables,
      );
    } catch {
      this.logger.error({
        ...logContext,
        message: 'Transactional email rendering failed',
      });

      throw new Error('Transactional email rendering failed');
    }

    const payload: CreateEmailOptions = {
      from: this.config.from,
      to: request.to,
      ...(this.config.replyTo ? { replyTo: this.config.replyTo } : {}),
      subject: renderedTemplate.subject,
      html: renderedTemplate.html,
    };

    const options = this.buildRequestOptions(request);
    const response = await this.resend.emails.send(payload, options);

    if (response.error) {
      this.logger.error({
        ...logContext,
        resendErrorName: response.error.name,
        resendStatusCode: response.error.statusCode,
        message: 'Transactional email failed',
      });

      throw new Error('Transactional email failed');
    }

    this.logger.log({
      ...logContext,
      resendId: response.data.id,
      message: 'Transactional email sent',
    });

    return {
      skipped: false,
      resendId: response.data.id,
    };
  }

  private buildRequestOptions(
    request: MailSendRequest,
  ): CreateEmailRequestOptions | undefined {
    if (!request.businessId) {
      return undefined;
    }

    return {
      idempotencyKey: `sport-tracker:${request.type}:${request.businessId}`,
    };
  }

  private getLogContext(request: MailSendRequest) {
    return {
      emailType: request.type,
      recipient: maskEmailAddress(request.to),
    };
  }
}

export function createResendClient(config: MailConfig): ResendEmailClient {
  if (!config.enabled) {
    return createDisabledResendClient();
  }

  return new Resend(config.apiKey);
}

function createDisabledResendClient(): ResendEmailClient {
  return {
    emails: {
      send: () => Promise.reject(new Error('Resend client is disabled')),
    },
  };
}

export function maskEmailAddress(email: string): string {
  const [localPart, domain] = email.split('@');

  if (!localPart || !domain) {
    return '***';
  }

  const visibleLocalPart =
    localPart.length <= 2 ? localPart : localPart.slice(0, 2);

  return `${visibleLocalPart}***@${domain}`;
}
