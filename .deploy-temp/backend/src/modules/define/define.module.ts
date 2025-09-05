import { Module } from '@nestjs/common';
import { DefineController, AdminDefineController } from './define.controller';
import { DefineService } from './define.service';

@Module({
  controllers: [DefineController, AdminDefineController],
  providers: [DefineService],
})
export class DefineModule {}
