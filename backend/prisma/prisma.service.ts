// src/infrastructure/prisma/prisma.service.ts (경로는 네 프로젝트에 맞춰)
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.connectWithRetry();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async connectWithRetry(maxAttempts = 10, baseMs = 300) {
    let attempt = 0;
    // 지수 백오프(최대 ~10초 내외)
    while (true) {
      try {
        await this.$connect();
        return;
      } catch (err) {
        attempt++;
        if (attempt >= maxAttempts) {
          throw err;
        }
        const wait = Math.min(baseMs * 2 ** (attempt - 1), 2000);
        // eslint-disable-next-line no-console
        console.warn(`[Prisma] connect failed (attempt ${attempt}/${maxAttempts}). retry in ${wait}ms`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
}