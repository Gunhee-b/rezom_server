import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtPayload, Tokens } from './types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  private async signTokens(userId: number, email: string, tokenVersion: number): Promise<Tokens> {
    const payload: JwtPayload = { sub: userId, email, tv: tokenVersion };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_TTL ?? '900s',
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_TTL ?? '7d',
    });
    return { accessToken, refreshToken };
  }

  async register(email: string, password: string, displayName: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already in use');

    const passwordHash = await argon2.hash(password);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, displayName, updatedAt: new Date() },
    });

    const tokens = await this.signTokens(user.id, user.email, user.tokenVersion);
    const refreshHash = await argon2.hash(tokens.refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: refreshHash },
    });

    return { user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role }, ...tokens };
  }

  async login(email: string, password: string) {
    console.log('[AUTH] Login attempt for:', email);
    console.log('[AUTH] Database query: prisma.user.findUnique({ where: { email: "' + email + '" } })');
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('[AUTH] User not found:', email);
      throw new UnauthorizedException('Invalid credentials');
    }
    
    console.log('[AUTH] Found user raw data:', JSON.stringify(user, null, 2));
    console.log('[AUTH] Found user:', { id: user.id, email: user.email, role: user.role });

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      console.log('[AUTH] Password verification failed for:', email);
      throw new UnauthorizedException('Invalid credentials');
    }
    
    console.log('[AUTH] Password verified for user ID:', user.id);

    const tokens = await this.signTokens(user.id, user.email, user.tokenVersion);
    console.log('[AUTH] Generated tokens for user ID:', user.id);
    
    const refreshHash = await argon2.hash(tokens.refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: refreshHash },
    });

    const result = { user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role }, ...tokens };
    console.log('[AUTH] Login successful for user ID:', user.id);
    return result;
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null, tokenVersion: { increment: 1 } },
    });
    return { ok: true };
  }

  async refresh(userId: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException('No session');

    const valid = await argon2.verify(user.refreshTokenHash, refreshToken);
    if (!valid) throw new UnauthorizedException('Invalid session');

    const tokens = await this.signTokens(user.id, user.email, user.tokenVersion);
    const refreshHash = await argon2.hash(tokens.refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: refreshHash },
    });

    return {
      ...tokens,
      user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role }
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return;
    }

    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExp = new Date(Date.now() + 3600000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp }
    });

    await this.sendResetEmail(user.email, resetToken);
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: { gt: new Date() }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExp: null,
        tokenVersion: user.tokenVersion + 1
      }
    });
  }

  private async sendResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://rezom.org'}/reset-password?token=${token}`;
    console.log(`Password reset link for ${email}: ${resetUrl}`);
  }
}
