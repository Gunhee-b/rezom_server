// src/modules/auth/auth.controller.ts
import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';

const RT_COOKIE = process.env.REFRESH_COOKIE_NAME ?? 'rezom_rt';
const CSRF_NAME = process.env.CSRF_HEADER ?? 'X-CSRF-Token';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN ?? '.rezom.org'; // admin/api 공유
const COOKIE_SECURE = true; // 프로덕션: https 전제
const COOKIE_SAMESITE = 'lax' as const;

function refreshCookieOpts() {
  return {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    domain: COOKIE_DOMAIN,
    path: '/auth',
    maxAge: 7 * 24 * 3600 * 1000,
  } as const;
}

function csrfCookieOpts() {
  return {
    httpOnly: false,           // 프론트에서 document.cookie로 읽음
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    domain: COOKIE_DOMAIN,
    path: '/',                 // 모든 경로에서 접근
    maxAge: 24 * 3600 * 1000,
  } as const;
}

function clearRefreshCookieOpts() {
  // clearCookie는 Max-Age가 없어도 되고, 속성만 동일하면 삭제됩니다.
  return {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    domain: COOKIE_DOMAIN,
    path: '/auth',
  } as const;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @UseGuards(RateLimitGuard)
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } =
      await this.auth.register(dto.email, dto.password, dto.displayName);

    // Refresh/CSRF 쿠키 설정
    res.cookie(RT_COOKIE, refreshToken, refreshCookieOpts());
    const csrf = Math.random().toString(36).slice(2);
    res.cookie(CSRF_NAME, csrf, csrfCookieOpts());

    return { user, accessToken };
  }

  @Post('login')
  @HttpCode(200)
  @UseGuards(RateLimitGuard)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.auth.login(dto.email, dto.password);

    res.cookie(RT_COOKIE, refreshToken, refreshCookieOpts());
    const csrf = Math.random().toString(36).slice(2);
    res.cookie(CSRF_NAME, csrf, csrfCookieOpts());

    return { user, accessToken };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rt = (req as any).cookies?.[RT_COOKIE];
    if (!rt) {
      return { ok: false, error: 'No refresh token' };
    }

    // 유저 파악 및 재발급
    const jwt = await import('jsonwebtoken');
    let payload: any = null;
    try {
      payload = jwt.verify(rt, process.env.JWT_REFRESH_SECRET || '');
    } catch (e) {
      console.log("JWT verify failed:", (e as any).message);
      return { ok: false, error: 'Invalid refresh token' };
    }
    const userId = Number(payload?.sub);
    if (!userId || isNaN(userId)) {
      return { ok: false, error: 'Invalid user ID in token' };
    }
    console.log("DEBUG: payload:", payload, "userId:", userId);
    const result = await this.auth.refresh(userId, rt);

    // RT Rotate + CSRF 재발급(선택)
    res.cookie(RT_COOKIE, result.refreshToken, refreshCookieOpts());
    const csrf = Math.random().toString(36).slice(2);
    res.cookie(CSRF_NAME, csrf, csrfCookieOpts());

    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = Number(req.user.sub);
    await this.auth.logout(userId);

    // 동일 속성으로 삭제
    res.clearCookie(RT_COOKIE, clearRefreshCookieOpts());

    // (선택) CSRF도 삭제하고 싶다면:
    res.clearCookie(CSRF_NAME, {
      httpOnly: false,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAMESITE,
      domain: COOKIE_DOMAIN,
      path: '/',
    });

    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    const { sub, email, role } = req.user;
    return { id: Number(sub), email, role };
  }
}
