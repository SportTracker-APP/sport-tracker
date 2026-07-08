import { ConfigService } from '@nestjs/config';

import { StravaTokenEncryptionService } from './strava-token-encryption.service';

const ACTIVE_KEY = Buffer.from(
  '0123456789abcdef0123456789abcdef',
).toString('base64');
const PREVIOUS_KEY = Buffer.from(
  'abcdef0123456789abcdef0123456789',
).toString('base64');

function createService(keys: string): StravaTokenEncryptionService {
  return new StravaTokenEncryptionService({
    get: jest.fn((name: string) =>
      name === 'STRAVA_TOKEN_ENCRYPTION_KEYS' ? keys : undefined,
    ),
  } as unknown as ConfigService);
}

describe('StravaTokenEncryptionService', () => {
  const accessContext = {
    userId: 'user-1',
    tokenType: 'access' as const,
  };

  it('encrypts and decrypts a token without storing its plaintext', () => {
    const service = createService(ACTIVE_KEY);
    const encrypted = service.encrypt('sensitive-token', accessContext);

    expect(encrypted).toMatch(/^enc:v1:/);
    expect(encrypted).not.toContain('sensitive-token');
    expect(service.decrypt(encrypted, accessContext)).toBe('sensitive-token');
  });

  it('uses a random IV for every encryption', () => {
    const service = createService(ACTIVE_KEY);

    expect(service.encrypt('same-token', accessContext)).not.toBe(
      service.encrypt('same-token', accessContext),
    );
  });

  it('refuses a token moved to another user or token type', () => {
    const service = createService(ACTIVE_KEY);
    const encrypted = service.encrypt('sensitive-token', accessContext);

    expect(() =>
      service.decrypt(encrypted, {
        userId: 'user-2',
        tokenType: 'access',
      }),
    ).toThrow('Impossible de déchiffrer');
    expect(() =>
      service.decrypt(encrypted, {
        userId: 'user-1',
        tokenType: 'refresh',
      }),
    ).toThrow('Impossible de déchiffrer');
  });

  it('detects tampering', () => {
    const service = createService(ACTIVE_KEY);
    const encrypted = service.encrypt('sensitive-token', accessContext);
    const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith('A') ? 'B' : 'A'}`;

    expect(() => service.decrypt(tampered, accessContext)).toThrow(
      'Impossible de déchiffrer',
    );
  });

  it('decrypts an old key and rotates it to the active key', () => {
    const oldService = createService(PREVIOUS_KEY);
    const oldCiphertext = oldService.encrypt('sensitive-token', accessContext);
    const rotatedService = createService(`${ACTIVE_KEY},${PREVIOUS_KEY}`);
    const rotatedCiphertext = rotatedService.reencryptIfNeeded(
      oldCiphertext,
      accessContext,
    );

    expect(rotatedCiphertext).not.toBe(oldCiphertext);
    expect(rotatedService.decrypt(rotatedCiphertext, accessContext)).toBe(
      'sensitive-token',
    );
    expect(rotatedService.needsReencryption(rotatedCiphertext)).toBe(false);
  });
});
