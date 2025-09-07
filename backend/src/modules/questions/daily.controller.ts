import { Body, Controller, Get, Put, UseGuards, Optional } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RedisService } from "../../infrastructure/redis/redis.service";
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

type SetDailyDto = { questionId: number }

// 내부적으로 Redis 클라이언트를 "최대한" 찾아서 반환

// 메모리 fallback (Redis 미연결/오류 대비) 
let memoryDailyQuestionId: number | null = null

@Controller('daily')
export class DailyQuestionController {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly redis: RedisService | undefined = undefined
  ) {}

  @Get('question')
  async getDaily() {
    console.log('=== GET DAILY QUESTION REQUEST RECEIVED ===');
    let questionId: number | null = null;
    
    // Try to get from Redis first
    try {
      const r = this.redis?.client
      if (r?.get) {
        const storedId = await r.get('daily:question:id')
        if (storedId !== null && storedId !== undefined) {
          questionId = parseInt(storedId);
          memoryDailyQuestionId = questionId;
        }
      }
    } catch {}
    
    // Fallback to memory
    if (questionId === null) {
      questionId = memoryDailyQuestionId;
    }
    
    console.log("questionId:", questionId, "type:", typeof questionId);
    // If we have a question ID, fetch the question details
    if (questionId !== null && questionId !== undefined && Number.isInteger(questionId) && questionId > 0) {
      try {
        const question = await this.prisma.question.findUnique({
          where: { id: questionId },
          include: {
            User: {
              select: { email: true }
            },
            Category: {
              select: { name: true }
            }
          }
        });
        
        if (question) {
          return { question };
        }
      } catch {}
    }
    
    // No question set or question not found
    return { question: null };
  }

  @UseGuards(JwtAuthGuard)
  @Put('question')
  async setDaily(@Body() dto: SetDailyDto) {
    try {
      console.log('Setting daily question:', dto);
      
      const questionId = dto?.questionId;
      if (!questionId || !Number.isInteger(questionId) && questionId > 0) {
        return { ok: false, error: 'Valid questionId is required' };
      }
      
      // Verify the question exists
      const question = await this.prisma.question.findUnique({
        where: { id: questionId }
      });
      if (!question) {
        return { ok: false, error: 'Question not found' };
      }
      
      console.log('Found question:', question.title);
      
      // Store in memory
      memoryDailyQuestionId = questionId;
      
      // Try to store in Redis if available
      try {
        const r = this.redis?.client
        if (r?.set) {
          await r.set('daily:question:id', questionId.toString(), 'EX', 60 * 60 * 24 * 30)
          console.log('Stored in Redis successfully');
        }
      } catch (redisError) {
        console.log('Redis storage failed, using memory only:', redisError);
      }
      
      console.log('Daily question set successfully');
      return { ok: true };
    } catch (error) {
      console.error('Error in setDaily:', error);
      return { ok: false, error: 'Internal server error' };
    }
  }
}
