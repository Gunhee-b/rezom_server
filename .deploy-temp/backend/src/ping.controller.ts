import { Controller, Get } from '@nestjs/common';

@Controller('ping')
export class PingController {
  @Get()
  ok() { return { ok: true }; }
}
