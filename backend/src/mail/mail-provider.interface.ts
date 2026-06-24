import { MailSendRequest, MailSendResult } from './mail.types';

export interface MailProvider {
  sendTemplate(request: MailSendRequest): Promise<MailSendResult>;
}
