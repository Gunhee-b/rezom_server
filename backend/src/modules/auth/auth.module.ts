import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule } from '@nestjs/config'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtAccessStrategy } from './jwt-access.strategy'
import { JwtRefreshStrategy } from './jwt-refresh.strategy'
import { JwtAuthGuard } from './jwt-auth.guard'
import { MailModule } from '../mail/mail.module'

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({}),
    JwtModule.register({}),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
