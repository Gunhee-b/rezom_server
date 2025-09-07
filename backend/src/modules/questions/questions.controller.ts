import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { DailyQuestionController } from './daily.controller';

type AuthedRequest = Request & { user?: { sub: number } };

@Controller('questions')
export class QuestionsController {
  constructor(private readonly svc: QuestionsService, private readonly dailyController: DailyQuestionController) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateQuestionDto, @Req() req: AuthedRequest) {
    console.log('=== QUESTION CREATE REQUEST RECEIVED ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body DTO:', JSON.stringify(dto, null, 2));
    console.log('Raw Body:', JSON.stringify(req.body, null, 2));
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('User from JWT:', req.user);
    console.log('=====================================');
    
    const userId = Number(req.user?.sub);
    return this.svc.create(dto, userId);
  }

  @Get()
  findAll(@Query('categoryId') categoryId?: string) {
    console.log('=== GET QUESTIONS REQUEST ===');
    console.log('CategoryId:', categoryId);
    const catId = categoryId ? Number(categoryId) : undefined;
    return this.svc.findAll(catId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateQuestionDto, @Req() req: AuthedRequest) {
    const userId = Number(req.user?.sub);
    const questionId = Number(id);
    
    // Check if user owns this question
    const question = await this.svc.findOne(questionId);
    if (!question) {
      throw new ForbiddenException('Question not found');
    }
    if (question.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own questions');
    }
    
    return this.svc.update(questionId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    const userId = Number(req.user?.sub);
    const questionId = Number(id);
    
    // Check if user owns this question
    const question = await this.svc.findOne(questionId);
    if (!question) {
      throw new ForbiddenException('Question not found');
    }
    if (question.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own questions');
    }
    
    
    return this.svc.remove(questionId);
  }

  @Get('daily')
  async getDaily() {
    return this.dailyController.getDaily();
  }
}
