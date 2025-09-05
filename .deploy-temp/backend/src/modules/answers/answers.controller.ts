import { Body, Controller, Get, Param, Post, Put, Delete, Req, UseGuards, ForbiddenException } from '@nestjs/common'
import { AnswersService } from './answers.service'
import { CreateAnswerDto } from './dto/create-answer.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Request } from 'express'

type AuthedRequest = Request & { user?: { sub: number } }

@Controller('answers')
export class AnswersController {
  constructor(private readonly svc: AnswersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateAnswerDto) {
    const userId = Number(req.user?.sub)
    return this.svc.create(userId, dto)
  }

  @Get('question/:questionId')
  getAnswersByQuestion(@Param('questionId') questionId: string) {
    return this.svc.getByQuestionId(Number(questionId));
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateAnswer(@Param('id') id: string, @Body() dto: any, @Req() req: AuthedRequest) {
    const userId = Number(req.user?.sub);
    const answerId = Number(id);
    
    // Check if user owns this answer
    const answer = await this.svc.findOne(answerId);
    if (!answer || answer.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own answers');
    }
    
    return this.svc.update(answerId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteAnswer(@Param('id') id: string, @Req() req: AuthedRequest) {
    const userId = Number(req.user?.sub);
    const answerId = Number(id);
    
    // Check if user owns this answer
    const answer = await this.svc.findOne(answerId);
    if (!answer || answer.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own answers');
    }
    
    return this.svc.remove(answerId);
  }
}
