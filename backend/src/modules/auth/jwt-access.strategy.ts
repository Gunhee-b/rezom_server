import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../infrastructure/prisma/prisma.service'

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const accessSecret = config.get<string>('JWT_ACCESS_SECRET')
    if (!accessSecret) {
      throw new Error('JWT_ACCESS_SECRET is not set')
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: accessSecret,
    })
  }

  async validate(payload: any) {
    console.log('=== JWT payload ===', JSON.stringify(payload));
    
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });
    
    console.log('=== Found user ===', JSON.stringify(user));
    
    if (!user) {
      console.log('=== User not found for ID ===', payload.sub);
      return null;
    }
    
    return {
      ...payload,
      role: user.role,
    };
  }
}
