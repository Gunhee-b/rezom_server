import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

type AuthedRequest = Request & { user?: { sub: number } };

@Controller('questions')
export class QuestionsController {
  constructor(private readonly svc: QuestionsService) {}

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
}
