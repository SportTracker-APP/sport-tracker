import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { PassportModule } from '@nestjs/passport';

import { ConfigModule } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleAuthService } from './google-auth.service';
import { MailModule } from '../../mail/mail.module';

@Module({
  imports: [ConfigModule, PassportModule, JwtModule.register({}), MailModule],

  controllers: [AuthController],

  providers: [AuthService, GoogleAuthService, JwtStrategy],

  exports: [JwtModule],
})
export class AuthModule {}
