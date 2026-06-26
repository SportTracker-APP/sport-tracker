import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';

import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from '../users/dto/update-profile.dto';

const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const bodyMetadata = <T>(metatype: new () => T): ArgumentMetadata => ({
  type: 'body',
  metatype,
});

describe('security validation pipe', () => {
  it('rejects unexpected DTO properties', async () => {
    await expect(
      validationPipe.transform(
        {
          firstName: 'Camille',
          email: 'camille@example.test',
          password: 'Password1',
          role: 'ADMIN',
        },
        bodyMetadata(RegisterDto),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects malformed reset tokens', async () => {
    await expect(
      validationPipe.transform(
        {
          token: 'not-a-token',
          password: 'Password1',
          confirmPassword: 'Password1',
        },
        bodyMetadata(ResetPasswordDto),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid avatar URLs', async () => {
    await expect(
      validationPipe.transform(
        {
          avatarUrl: 'javascript:alert(1)',
        },
        bodyMetadata(UpdateProfileDto),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
