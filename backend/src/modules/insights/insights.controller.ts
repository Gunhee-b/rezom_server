import { Body, Controller, Get, Post, Put, Delete, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { CreateInsightDto } from './dto/create-insight.dto';
import { UpdateInsightDto } from './dto/update-insight.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

type AuthedRequest = Request & { user?: { sub: number } };

@Controller('insights')
export class InsightsController {
  constructor(private readonly svc: InsightsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateInsightDto) {
    const userId = Number(req.user?.sub);
    return this.svc.create(userId, dto);
  }

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.svc.findByUser(Number(userId));
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyInsights(@Req() req: AuthedRequest) {
    const userId = Number(req.user?.sub);
    return this.svc.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateInsightDto, @Req() req: AuthedRequest) {
    const userId = Number(req.user?.sub);
    const insightId = Number(id);
    
    // Check if user owns this insight
    const insight = await this.svc.findOne(insightId);
    if (insight.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own insights');
    }
    
    return this.svc.update(insightId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    const userId = Number(req.user?.sub);
    const insightId = Number(id);
    
    // Check if user owns this insight
    const insight = await this.svc.findOne(insightId);
    if (insight.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own insights');
    }
    
    return this.svc.remove(insightId);
  }
}