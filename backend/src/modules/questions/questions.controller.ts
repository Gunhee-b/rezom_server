import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly svc: QuestionsService) {}

  @Post()
  async create(@Body() dto: CreateQuestionDto, @Req() req: any) {
    console.log('=== QUESTION CREATE REQUEST RECEIVED ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body DTO:', JSON.stringify(dto, null, 2));
    console.log('Raw Body:', JSON.stringify(req.body, null, 2));
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('=====================================');
    
    return this.svc.create(dto, 4); // Use fixed user ID for now
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
