import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'

function fromRefreshCookie(req: any): string | null {
  return req?.cookies?.refreshToken ?? null
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly config: ConfigService) {
    const refreshSecret = config.get<string>('JWT_REFRESH_SECRET')
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not set')
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([fromRefreshCookie]),
      ignoreExpiration: false,
      secretOrKey: refreshSecret, // ✅ string 보장
      passReqToCallback: false,
    })
  }

  async validate(payload: any) {
    return payload
  }
}
