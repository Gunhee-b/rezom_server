import { Body, Controller, Get, Put, UseGuards, Optional } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RedisService } from "../../infrastructure/redis/redis.service";

type SetDailyDto = { question: string }

// 내부적으로 Redis 클라이언트를 "최대한" 찾아서 반환

// 메모리 fallback (Redis 미연결/오류 대비)
let memoryDaily: string | null = null

@Controller('questions')
export class DailyQuestionController {
  constructor(@Optional() private readonly redis?: RedisService) {}

  @Get('daily')
  async getDaily() {
    try {
      const r = this.redis?.client
      if (r?.get) {
        const text = await r.get('daily:question')
        if (text !== null && text !== undefined) {
          memoryDaily = text
        }
        return { question: text ?? memoryDaily ?? null }
      }
    } catch {}
    return { question: memoryDaily ?? null }
  }

  @UseGuards(JwtAuthGuard)
  @Put('daily')
  async setDaily(@Body() dto: SetDailyDto) {
    const q = (dto?.question ?? '').trim()
    if (!q) return { ok: false }
    memoryDaily = q
    try {
      const r = this.redis?.client
      if (r?.set) {
        // node-redis v4 옵션 형태 시도
        try {
          await r.set('daily:question', q, "EX", 60 * 60 * 24 * 30)
        } catch {
          // ioredis 스타일
          await r.set('daily:question', q, 'EX', 60 * 60 * 24 * 30)
        }
      }
    } catch {}
    return { ok: true }
  }
}
