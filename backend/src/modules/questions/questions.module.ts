// backend/src/modules/questions/questions.module.ts
import { Module } from '@nestjs/common'
import { QuestionsController } from './questions.controller'
import { QuestionsService } from './questions.service'
import { DailyQuestionController } from './daily.controller'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { RedisModule } from '../../infrastructure/redis/redis.module'
import { EventsModule } from '../events/events.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [PrismaModule, RedisModule, EventsModule, AuthModule],
  controllers: [QuestionsController, DailyQuestionController],
  providers: [QuestionsService],
})
export class QuestionsModule {}
