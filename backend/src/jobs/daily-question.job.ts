import { RedisService } from "../infrastructure/redis/redis.service";
import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

// 파일 상단 가까이에 공통 헬퍼 추가
const DAILY_CACHE_KEY = 'daily:question';
const DAILY_TTL = 60 * 60 * 24; // 24h

@Injectable()
export class DailyQuestionJob {
  private readonly logger = new Logger(DailyQuestionJob.name);
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly redis?: RedisService,
  ) {}

  // 매일 09:00:00 (KST)
  @Cron('0 0 9 * * *', { timeZone: 'Asia/Seoul' })
  async pickDaily() {
    // 우선순위: (1) isDaily=true 중 최신 → (2) 태그에 'daily' 포함 → (3) 최신 질문
    const candidate = await this.prisma.question.findFirst({
      where: { isDaily: true },
      orderBy: { createdAt: 'desc' },
      // include: { author: true, category: true },
    })
    || await this.prisma.question.findFirst({
      where: { tags: { path: '$', array_contains: ['daily'] as any } },
      orderBy: { createdAt: 'desc' },
      // include: { author: true, category: true },
    })
    || await this.prisma.question.findFirst({
      orderBy: { createdAt: 'desc' },
      // include: { author: true, category: true },
    });

    if (!candidate) {
      this.logger.warn('No question found to set as daily');
      if (this.redis?.client) await this.redis?.client?.del(DAILY_CACHE_KEY);
      return;
    }

    // 캐시에 저장 (24h)
      if (this.redis?.client) await this.redis?.client?.del(DAILY_CACHE_KEY);
    this.logger.log(`Daily question cached: id=${candidate.id}`);
  }

  // 서버 부팅 시 캐시가 비었으면 즉시 warm-up (선택)
  async warmupIfNeeded() {
      if (this.redis?.client) await this.redis?.client?.del(DAILY_CACHE_KEY);
    const exists = this.redis?.client ? await this.redis.client.exists(DAILY_CACHE_KEY) : 0;
    if (!exists) await this.pickDaily();
  }
}
