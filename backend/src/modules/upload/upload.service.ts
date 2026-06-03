import { BadRequestException, Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/prisma/prisma.service';

import { createClient } from '@supabase/supabase-js';

@Injectable()
export class UploadService {
  private supabase;

  constructor(
    private readonly configService: ConfigService,

    private readonly prisma: PrismaService,
  ) {
    this.supabase = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async uploadAvatar(userId: string, file: any) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const fileExtension = file.originalname.split('.').pop();

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
