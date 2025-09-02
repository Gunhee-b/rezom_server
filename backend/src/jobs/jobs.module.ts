import { Module, OnModuleInit } from '@nestjs/common';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { RedisModule } from '../infrastructure/redis/redis.module';
import { DailyQuestionJob } from './daily-question.job';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [DailyQuestionJob],
})
export class JobsModule implements OnModuleInit {
  constructor(private readonly daily: DailyQuestionJob) {}
  async onModuleInit() {
    await this.daily.warmupIfNeeded(); // 서버 시작 시 1회 캐시 채움
  }
}