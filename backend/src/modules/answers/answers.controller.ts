import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
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
}
