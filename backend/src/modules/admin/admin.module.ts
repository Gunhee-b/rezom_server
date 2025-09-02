import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [RedisModule, PrismaModule, EventsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}