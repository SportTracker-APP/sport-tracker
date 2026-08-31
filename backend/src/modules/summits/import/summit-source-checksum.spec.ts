import { createHash } from 'node:crypto';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  parseExpectedChecksum,
  verifySourceArchiveChecksum,
} from './summit-source-checksum';

describe('department source checksum', () => {
  it('recognizes the historical IGN MD5 format and explicit SHA-256', () => {
    expect(
      parseExpectedChecksum('efa8b87b3751e737d90895e494f875f7'),
    ).toMatchObject({ algorithm: 'md5' });
    expect(parseExpectedChecksum(`sha256:${'a'.repeat(64)}`)).toEqual({
      algorithm: 'sha256',
      digest: 'a'.repeat(64),
    });
  });

  it('verifies the archive bytes and rejects a mismatched snapshot', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'hovren-checksum-'));
    const archivePath = path.join(directory, 'source.7z');
    const content = 'snapshot IGN immuable';
    await writeFile(archivePath, content, 'utf8');
    const checksum = createHash('sha256').update(content).digest('hex');

    await expect(
      verifySourceArchiveChecksum(archivePath, checksum),
    ).resolves.toMatchObject({ algorithm: 'sha256', actual: checksum });
    await expect(
      verifySourceArchiveChecksum(archivePath, '0'.repeat(64)),
    ).rejects.toThrow('Checksum source incorrect');
  });
});
