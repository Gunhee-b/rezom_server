import { Controller, Post, Body, UseGuards, HttpCode, Param } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

class PurgeCacheDto {
  @IsNotEmpty()
  scope!: string;
  
  @IsOptional()
  @IsString()
  slug?: string;
}

class UpdateTop5Dto {
  @IsArray()
  @IsInt({ each: true })
  questionIds!: number[];
}

@Controller('admin')
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('cache/purge')
  @HttpCode(200)
  async purgeCache(@Body() dto: PurgeCacheDto) {
    const result = await this.adminService.purgeCache(dto.scope, dto.slug);
    return result;
  }

  @Post('define/:slug/top5')
  @HttpCode(200)
  async updateTop5(@Param('slug') slug: string, @Body() dto: UpdateTop5Dto) {
    const result = await this.adminService.updateTop5Questions(slug, dto.questionIds);
    return result;
  }
}