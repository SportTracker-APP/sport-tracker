import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, SummitAdminAuditAction } from '@prisma/client';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

import { PrismaService } from '../../prisma/prisma.service';
import { AdminSummitImageDto } from './dto/admin-summit-image.dto';

const MAX_SUMMIT_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_SUMMIT_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

@Injectable()
export class AdminSummitMediaService {
  private readonly bucket: string;
  private readonly supabase: ReturnType<typeof createClient>;

  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.bucket =
      configService.get<string>('SUPABASE_SUMMIT_IMAGES_BUCKET') ??
      'summit-images';
    this.supabase = createClient(
      configService.getOrThrow<string>('SUPABASE_URL'),
      configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async upload(
    adminUserId: string,
    summitId: string,
    file: Express.Multer.File,
    dto: AdminSummitImageDto,
  ) {
    if (!file) throw new BadRequestException('Une image est requise');
    if (file.size > MAX_SUMMIT_IMAGE_SIZE) {
      throw new BadRequestException('Image trop lourde : 8 Mo maximum');
    }
    if (!ALLOWED_SUMMIT_IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Format non pris en charge : JPEG, PNG ou WEBP uniquement',
      );
    }

    const summit = await this.prisma.summit.findUnique({
      where: { id: summitId },
      select: {
        id: true,
        editorialImageUrl: true,
        editorialImageCredit: true,
        editorialSourceUrl: true,
      },
    });
    if (!summit) throw new NotFoundException('Sommet introuvable');

    let optimized: Buffer;
    try {
      const image = sharp(file.buffer, {
        failOn: 'error',
        limitInputPixels: 40_000_000,
      });
      const metadata = await image.metadata();
      if (
        !metadata.format ||
        !['jpeg', 'png', 'webp'].includes(metadata.format)
      ) {
        throw new Error('unsupported image');
      }
      optimized = await image
        .rotate()
        .resize(1_800, 1_200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
    } catch {
      throw new BadRequestException(
        'Le fichier ne contient pas une image JPEG, PNG ou WEBP valide',
      );
    }

    await this.ensureBucket();
    const objectPath = this.objectPath(summitId);
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(objectPath, optimized, {
        upsert: true,
        contentType: 'image/webp',
        cacheControl: '31536000',
      });
    if (error) {
      throw new BadRequestException(
        `Le stockage de la photo a échoué : ${error.message}`,
      );
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage.from(this.bucket).getPublicUrl(objectPath);
    const versionedUrl = `${publicUrl}?v=${Date.now()}`;

    await this.prisma.$transaction(async (transaction) => {
      await transaction.summit.update({
        where: { id: summitId },
        data: {
          editorialImageUrl: versionedUrl,
          editorialImageCredit: this.clean(dto.imageCredit),
          editorialSourceUrl: this.clean(dto.sourceUrl),
        },
      });
      await transaction.summitAdminAuditLog.create({
        data: {
          summitId,
          adminUserId,
          action: SummitAdminAuditAction.EDITORIAL_IMAGE_UPDATED,
          before: {
            editorialImageUrl: summit.editorialImageUrl,
            editorialImageCredit: summit.editorialImageCredit,
            editorialSourceUrl: summit.editorialSourceUrl,
          },
          after: {
            editorialImageUrl: versionedUrl,
            editorialImageCredit: this.clean(dto.imageCredit),
            editorialSourceUrl: this.clean(dto.sourceUrl),
          },
        },
      });
    });
  }

  async updateMetadata(
    adminUserId: string,
    summitId: string,
    dto: AdminSummitImageDto,
  ) {
    if (dto.imageCredit === undefined && dto.sourceUrl === undefined) {
      throw new BadRequestException('Aucune modification transmise');
    }
    const summit = await this.prisma.summit.findUnique({
      where: { id: summitId },
      select: {
        editorialImageUrl: true,
        editorialImageCredit: true,
        editorialSourceUrl: true,
      },
    });
    if (!summit) throw new NotFoundException('Sommet introuvable');
    if (!summit.editorialImageUrl) {
      throw new BadRequestException(
        'Ajoutez une photo éditoriale avant de renseigner son crédit',
      );
    }

    const nextCredit =
      dto.imageCredit === undefined
        ? summit.editorialImageCredit
        : this.clean(dto.imageCredit);
    const nextSource =
      dto.sourceUrl === undefined
        ? summit.editorialSourceUrl
        : this.clean(dto.sourceUrl);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.summit.update({
        where: { id: summitId },
        data: {
          editorialImageCredit: nextCredit,
          editorialSourceUrl: nextSource,
        },
      });
      await transaction.summitAdminAuditLog.create({
        data: {
          summitId,
          adminUserId,
          action: SummitAdminAuditAction.EDITORIAL_IMAGE_UPDATED,
          before: {
            editorialImageCredit: summit.editorialImageCredit,
            editorialSourceUrl: summit.editorialSourceUrl,
          },
          after: {
            editorialImageCredit: nextCredit,
            editorialSourceUrl: nextSource,
          },
        },
      });
    });
  }

  async remove(adminUserId: string, summitId: string) {
    const summit = await this.prisma.summit.findUnique({
      where: { id: summitId },
      select: {
        editorialImageUrl: true,
        editorialImageCredit: true,
        editorialSourceUrl: true,
      },
    });
    if (!summit) throw new NotFoundException('Sommet introuvable');
    if (!summit.editorialImageUrl) return;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([this.objectPath(summitId)]);
    if (error) {
      throw new BadRequestException(
        `La suppression de la photo a échoué : ${error.message}`,
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.summit.update({
        where: { id: summitId },
        data: {
          editorialImageUrl: null,
          editorialImageCredit: null,
          editorialSourceUrl: null,
        },
      });
      await transaction.summitAdminAuditLog.create({
        data: {
          summitId,
          adminUserId,
          action: SummitAdminAuditAction.EDITORIAL_IMAGE_REMOVED,
          before: {
            editorialImageUrl: summit.editorialImageUrl,
            editorialImageCredit: summit.editorialImageCredit,
            editorialSourceUrl: summit.editorialSourceUrl,
          },
          after: Prisma.JsonNull,
        },
      });
    });
  }

  private objectPath(summitId: string) {
    const stableId = createHash('sha256').update(summitId).digest('hex');
    return `summits/${stableId}/main.webp`;
  }

  private clean(value?: string) {
    const cleaned = value?.trim();
    return cleaned || null;
  }

  private async ensureBucket() {
    const { data, error } = await this.supabase.storage.getBucket(this.bucket);
    if (data) return;
    if (error) {
      const { error: createError } = await this.supabase.storage.createBucket(
        this.bucket,
        {
          public: true,
          fileSizeLimit: MAX_SUMMIT_IMAGE_SIZE,
          allowedMimeTypes: ['image/webp'],
        },
      );
      if (createError && !/already exists/i.test(createError.message)) {
        throw new BadRequestException(
          `Le stockage des photos est indisponible : ${createError.message}`,
        );
      }
    }
  }
}
