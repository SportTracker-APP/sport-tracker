import { BadRequestException, Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/prisma/prisma.service';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const avatarMimeExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class UploadService {
  private supabase: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,

    private readonly prisma: PrismaService,
  ) {
    this.supabase = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const fileExtension = avatarMimeExtensions[file.mimetype];

    if (!fileExtension) {
      throw new BadRequestException('Type de fichier avatar non autorisé');
    }

    const filePath = `avatars/${userId}-${Date.now()}.${fileExtension}`;

    // UPLOAD TO SUPABASE
    const { error } = await this.supabase.storage
      .from('avatars')
      .upload(filePath, file.buffer, {
        upsert: true,
        contentType: file.mimetype,
      });

    if (error) {
      throw new BadRequestException(error.message);
    }

    // GET PUBLIC URL
    const {
      data: { publicUrl },
    } = this.supabase.storage.from('avatars').getPublicUrl(filePath);

    // SAVE IN DATABASE
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        avatarUrl: publicUrl,
      },
    });

    return {
      avatarUrl: publicUrl,
    };
  }
}
