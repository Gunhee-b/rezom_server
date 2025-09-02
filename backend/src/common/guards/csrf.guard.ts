// src/common/guards/csrf.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class CsrfGuard implements CanActivate {
  private header = process.env.CSRF_HEADER ?? 'X-CSRF-Token';
  canActivate(ctx: ExecutionContext): boolean {
    const req: any = ctx.switchToHttp().getRequest();
    const tokenFromHeader = req.headers[this.header.toLowerCase()];
    const tokenFromCookie = req.cookies?.[this.header];
    if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
      throw new UnauthorizedException('Bad CSRF token');
    }
    return true;
  }
}