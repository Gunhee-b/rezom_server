#!/bin/bash

echo "최종 단순 수정 시작..."

# 1. rate-limit.guard.ts - safeRedisOperation 제거하고 단순하게
cat > src/common/guards/rate-limit.guard.ts << 'EOF'
import { Injectable, CanActivate, ExecutionContext, TooManyRequestsException, Inject, Optional } from '@nestjs/common';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Optional() private readonly redis?: any,
    private readonly max: number = 100,
    private readonly window: number = 60
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const key = `rate_limit:${ip}`;

    // Redis가 없으면 그냥 통과
    if (!this.redis?.client) return true;

    try {
      const ttl = await this.redis.client.ttl(key);
      const count = await this.redis.client.incr(key);
      if (ttl === -1) await this.redis.client.expire(key, this.window);
      
      if (count > this.max) throw new TooManyRequestsException('Too many requests');
      return true;
    } catch (error) {
      // Redis 에러시 그냥 통과
      return true;
    }
  }
}
EOF

# 2. daily-question.job.ts - safeRedisOperation 제거하고 단순하게
sed -i '/safeRedisOperation/c\      if (this.redis?.client) await this.redis.client.del(DAILY_CACHE_KEY);' src/jobs/daily-question.job.ts
sed -i '/await.*client\.set.*DAILY_CACHE_KEY/c\    if (this.redis?.client) await this.redis.client.set(DAILY_CACHE_KEY, JSON.stringify(candidate), "EX", DAILY_TTL);' src/jobs/daily-question.job.ts
sed -i '/const exists.*safeRedisOperation/c\    const exists = this.redis?.client ? await this.redis.client.exists(DAILY_CACHE_KEY) : 0;' src/jobs/daily-question.job.ts

# 3. 모든 safeRedisOperation import 제거
find src/ -name "*.ts" -exec sed -i '/safeRedisOperation/d' {} \;

echo "최종 수정 완료"
