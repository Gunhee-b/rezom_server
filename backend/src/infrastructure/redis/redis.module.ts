import { Module, Logger } from '@nestjs/common';
import IORedis, { Redis } from 'ioredis';

const logger = new Logger('Redis');

export const REDIS = 'REDIS_CLIENT';

@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: (): Redis => {
        const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
        const client = new IORedis(url, {
          // 연결을 지연시켜 모듈 초기화 시점에 막히지 않게 함
          lazyConnect: true,
          // 명령 재시도 한도를 해제(명령 대기 중 throw 방지)
          maxRetriesPerRequest: null,
          // 오프라인 큐 비활성(원하면 true로 두고 try/catch로 보호)
          enableOfflineQueue: false,
          // 재연결 전략은 아주 짧게
          retryStrategy: (times) => Math.min(times * 500, 5_000),
        });

        client.on('error', (err) => {
          logger.warn(`Redis error: ${err?.message || err}`);
        });
        client.on('connect', () => logger.log('Redis connected'));
        client.on('ready', () => logger.log('Redis ready'));

        // ❗ 여기서 client.connect() 또는 ping 등을 절대 수행하지 말 것
        return client;
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
