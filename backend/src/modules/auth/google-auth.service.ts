import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export type GoogleIdentity = {
  subject: string;
  email: string;
  firstName: string;
  lastName: string | null;
};

@Injectable()
export class GoogleAuthService {
  constructor(private readonly configService: ConfigService) {}

  createAuthorizationUrl(state: string): string {
    return this.createClient().generateAuthUrl({
      access_type: 'online',
      include_granted_scopes: true,
      prompt: 'select_account',
      scope: ['openid', 'email', 'profile'],
      state,
    });
  }

  async exchangeCode(code: string): Promise<GoogleIdentity> {
    const clientId = this.getRequiredConfig('GOOGLE_CLIENT_ID');
    const client = this.createClient();
    const { tokens } = await client.getToken({
      code,
      redirect_uri: this.getRequiredConfig('GOOGLE_CALLBACK_URL'),
    });

    if (!tokens.id_token) {
      throw new UnauthorizedException('Identité Google invalide');
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new UnauthorizedException('Adresse Google non vérifiée');
    }

    return {
      subject: payload.sub,
      email: payload.email,
      firstName:
        payload.given_name?.trim() ||
        payload.name?.trim().split(/\s+/)[0] ||
        'Aventurier',
      lastName: payload.family_name?.trim() || null,
    };
  }

  private createClient(): OAuth2Client {
    return new OAuth2Client(
      this.getRequiredConfig('GOOGLE_CLIENT_ID'),
      this.getRequiredConfig('GOOGLE_CLIENT_SECRET'),
      this.getRequiredConfig('GOOGLE_CALLBACK_URL'),
    );
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key)?.trim();

    if (!value) {
      throw new ServiceUnavailableException(
        'La connexion Google est temporairement indisponible',
      );
    }

    return value;
  }
}
