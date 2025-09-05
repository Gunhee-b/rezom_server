import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class PasswordResetController {
  constructor(private readonly authService: AuthService) {}

  @Post('forgot-password')
  async forgotPassword(@Body() dto: { email: string }) {
    try {
      await this.authService.requestPasswordReset(dto.email);
      return { message: 'If an account exists, a reset email has been sent.' };
    } catch (error) {
      return { message: 'If an account exists, a reset email has been sent.' };
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: { token: string; newPassword: string }) {
    try {
      await this.authService.resetPassword(dto.token, dto.newPassword);
      return { message: 'Password successfully reset.' };
    } catch (error) {
      throw new HttpException('Invalid or expired reset token', HttpStatus.BAD_REQUEST);
    }
  }
}
