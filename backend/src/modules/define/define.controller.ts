import { Controller, Get, Post, Body, Param, UseGuards, Put } from '@nestjs/common';
import { DefineService } from './define.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('define')
export class DefineController {
  constructor(private readonly defineService: DefineService) {}

  @Get(':slug/top5')
  async getTop5(@Param('slug') slug: string) {
    return this.defineService.getTop5Questions(slug);
  }

  @Get('concepts/:slug/keywords')
  async getKeywords(@Param('slug') slug: string) {
    return this.defineService.getKeywords(slug);
  }

  @Get('concepts/:slug')
  async getConcept(@Param('slug') slug: string) {
    return this.defineService.getConcept(slug);
  }

  @Get('concepts/:slug/questions')
  async getConceptQuestions(@Param('slug') slug: string) {
    return this.defineService.getConceptQuestions(slug);
  }

  // Add the missing route for individual question access
  @Get(':slug/questions/:id')
  async getQuestion(@Param('slug') slug: string, @Param('id') id: string) {
    return this.defineService.getQuestion(slug, parseInt(id));
  }
}

@Controller('admin/define')
export class AdminDefineController {
  constructor(private readonly defineService: DefineService) {}

  @Post(':slug/top5')
  @UseGuards(JwtAuthGuard)
  async updateTop5(@Param('slug') slug: string, @Body() body: { questionIds: number[] }) {
    return this.defineService.updateTop5Questions(slug, body.questionIds);
  }

  @Put('concepts/:slug/keywords')
  @UseGuards(JwtAuthGuard) 
  async updateKeywords(@Param('slug') slug: string, @Body() body: any) {
    return this.defineService.updateKeywords(slug, body);
  }
}
