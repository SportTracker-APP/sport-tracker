import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

export type StravaTokenType = 'access' | 'refresh';

export interface StravaTokenContext {
  userId: string;
  tokenType: StravaTokenType;
}

interface EncryptionKey {
  id: string;
  value: Buffer;
}

const TOKEN_PREFIX = 'enc:v1';
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;

@Injectable()
export class StravaTokenEncryptionService {
  private readonly keys = new Map<string, EncryptionKey>();
  private readonly activeKey: EncryptionKey | null;

  constructor(private readonly configService: ConfigService) {
    const configuredKeys = this.configService
      .get<string>('STRAVA_TOKEN_ENCRYPTION_KEYS')
      ?.split(',')
      .map((key) => key.trim())
      .filter(Boolean);

    const parsedKeys = (configuredKeys ?? []).map((key) =>
      this.parseEncryptionKey(key),
    );

    for (const key of parsedKeys) {
      this.keys.set(key.id, key);
    }

    this.activeKey = parsedKeys[0] ?? null;
  }

  isConfigured(): boolean {
    return this.activeKey !== null;
  }

  encrypt(token: string, context: StravaTokenContext): string {
    const activeKey = this.requireActiveKey();
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv('aes-256-gcm', activeKey.value, iv, {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    });

    cipher.setAAD(this.createAdditionalAuthenticatedData(context));

    const ciphertext = Buffer.concat([
      cipher.update(token, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
      TOKEN_PREFIX,
      activeKey.id,
      iv.toString('base64url'),
      authTag.toString('base64url'),
      ciphertext.toString('base64url'),
    ].join(':');
  }

  decrypt(storedToken: string, context: StravaTokenContext): string {
    if (!this.isEncrypted(storedToken)) {
      this.requireActiveKey();
      return storedToken;
    }

    const parts = storedToken.split(':');

    if (parts.length !== 6) {
      throw this.decryptionError();
    }

    const [, version, keyId, encodedIv, encodedAuthTag, encodedCiphertext] =
      parts;

    if (`enc:${version}` !== TOKEN_PREFIX) {
      throw this.decryptionError();
    }

    const key = this.keys.get(keyId);

    if (!key) {
      throw this.decryptionError();
    }

    try {
      const iv = Buffer.from(encodedIv, 'base64url');
      const authTag = Buffer.from(encodedAuthTag, 'base64url');
      const ciphertext = Buffer.from(encodedCiphertext, 'base64url');

      if (
        iv.length !== IV_LENGTH_BYTES ||
        authTag.length !== AUTH_TAG_LENGTH_BYTES
      ) {
        throw new Error('Invalid encrypted token payload');
      }

      const decipher = createDecipheriv('aes-256-gcm', key.value, iv, {
        authTagLength: AUTH_TAG_LENGTH_BYTES,
      });

      decipher.setAAD(this.createAdditionalAuthenticatedData(context));
      decipher.setAuthTag(authTag);

      return Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw this.decryptionError();
    }
  }

  reencryptIfNeeded(
    storedToken: string,
    context: StravaTokenContext,
  ): string {
    if (!this.needsReencryption(storedToken)) {
      return storedToken;
    }

    return this.encrypt(this.decrypt(storedToken, context), context);
  }

  needsReencryption(storedToken: string): boolean {
    const activeKey = this.requireActiveKey();

    if (!this.isEncrypted(storedToken)) {
      return true;
    }

    const parts = storedToken.split(':');

    return parts.length !== 6 || parts[2] !== activeKey.id;
  }

  private isEncrypted(token: string): boolean {
    return token.startsWith(`${TOKEN_PREFIX}:`);
  }

  private parseEncryptionKey(encodedKey: string): EncryptionKey {
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encodedKey)) {
      throw new Error(
        'STRAVA_TOKEN_ENCRYPTION_KEYS must contain valid base64 keys',
      );
    }

    const value = Buffer.from(encodedKey, 'base64');

    if (value.length !== 32) {
      throw new Error(
        'Each STRAVA_TOKEN_ENCRYPTION_KEYS entry must decode to exactly 32 bytes',
      );
    }

    return {
      id: createHash('sha256').update(value).digest('hex').slice(0, 12),
      value,
    };
  }

  private requireActiveKey(): EncryptionKey {
    if (!this.activeKey) {
      throw new InternalServerErrorException(
        'Le chiffrement des identifiants Strava n’est pas configuré',
      );
    }

    return this.activeKey;
  }

  private createAdditionalAuthenticatedData(
    context: StravaTokenContext,
  ): Buffer {
    return Buffer.from(
      `strava-token:v1:${context.userId}:${context.tokenType}`,
      'utf8',
    );
  }

  private decryptionError(): InternalServerErrorException {
    return new InternalServerErrorException(
      'Impossible de déchiffrer les identifiants Strava',
    );
  }
}
