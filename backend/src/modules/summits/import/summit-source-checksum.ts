import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

type SupportedChecksumAlgorithm = 'md5' | 'sha256';

export function parseExpectedChecksum(value: string): {
  algorithm: SupportedChecksumAlgorithm;
  digest: string;
} {
  const normalized = value.trim().toLowerCase();
  const prefixed = /^(md5|sha256):([a-f0-9]+)$/.exec(normalized);
  const algorithm = prefixed?.[1] as SupportedChecksumAlgorithm | undefined;
  const digest = prefixed?.[2] ?? normalized;
  const inferredAlgorithm =
    algorithm ?? (digest.length === 32 ? 'md5' : 'sha256');
  const expectedLength = inferredAlgorithm === 'md5' ? 32 : 64;

  if (!/^[a-f0-9]+$/.test(digest) || digest.length !== expectedLength) {
    throw new Error(
      'Checksum invalide : utilisez un MD5 de 32 caractères ou un SHA-256 de 64 caractères.',
    );
  }
  return { algorithm: inferredAlgorithm, digest };
}

export async function verifySourceArchiveChecksum(
  archivePath: string,
  expectedChecksum: string,
) {
  const expected = parseExpectedChecksum(expectedChecksum);
  const hash = createHash(expected.algorithm);
  const stream = createReadStream(archivePath);

  for await (const chunk of stream) hash.update(chunk as Buffer);
  const actual = hash.digest('hex');
  if (actual !== expected.digest) {
    throw new Error(
      `Checksum source incorrect (${expected.algorithm}) : attendu ${expected.digest}, reçu ${actual}`,
    );
  }
  return { ...expected, actual };
}
