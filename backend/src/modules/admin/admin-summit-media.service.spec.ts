/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Jest asymmetric matchers expose `any` in their public typings. */

import { ConfigService } from '@nestjs/config';
import { SummitAdminAuditAction } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

import { PrismaService } from '../../prisma/prisma.service';
import { AdminSummitMediaService } from './admin-summit-media.service';

jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }));

describe('AdminSummitMediaService', () => {
  const upload = jest.fn().mockResolvedValue({ error: null });
  const remove = jest.fn().mockResolvedValue({ error: null });
  const getPublicUrl = jest.fn().mockReturnValue({
    data: { publicUrl: 'https://storage.test/summits/main.webp' },
  });
  const storage = {
    from: jest.fn().mockReturnValue({ upload, remove, getPublicUrl }),
    getBucket: jest
      .fn()
      .mockResolvedValue({ data: { id: 'summit-images' }, error: null }),
    createBucket: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(createClient).mockReturnValue({ storage } as never);
  });

  function service(prisma: Record<string, unknown>) {
    const config = {
      get: jest.fn().mockReturnValue('summit-images'),
      getOrThrow: jest.fn((key: string) =>
        key === 'SUPABASE_URL' ? 'https://supabase.test' : 'service-role',
      ),
    };
    return new AdminSummitMediaService(
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
  }

  it('validates, optimizes and stores a stable WebP editorial image with audit', async () => {
    const update = jest.fn().mockResolvedValue({});
    const audit = jest.fn().mockResolvedValue({});
    const transaction = {
      summit: { update },
      summitAdminAuditLog: { create: audit },
    };
    const prisma = {
      summit: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'grand-velan',
          editorialImageUrl: null,
          editorialImageCredit: null,
          editorialSourceUrl: null,
        }),
      },
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const buffer = await sharp({
      create: {
        width: 20,
        height: 20,
        channels: 3,
        background: '#24513a',
      },
    })
      .png()
      .toBuffer();

    await service(prisma).upload(
      'admin-1',
      'grand-velan',
      {
        buffer,
        size: buffer.length,
        mimetype: 'image/png',
      } as Express.Multer.File,
      { imageCredit: 'Photo Test', sourceUrl: 'https://example.test/photo' },
    );

    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^summits\/[a-f0-9]{64}\/main\.webp$/),
      expect.any(Buffer),
      expect.objectContaining({ contentType: 'image/webp', upsert: true }),
    );
    expect(update).toHaveBeenCalledWith({
      where: { id: 'grand-velan' },
      data: expect.objectContaining({
        editorialImageUrl: expect.stringContaining('?v='),
        editorialImageCredit: 'Photo Test',
      }),
    });
    expect(audit).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: SummitAdminAuditAction.EDITORIAL_IMAGE_UPDATED,
        adminUserId: 'admin-1',
      }),
    });
  });
});
