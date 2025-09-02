import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UsersService } from './users.service'
import { Request } from 'express'

type AuthedRequest = Request & { user?: { sub: number } }

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/me/questions
  @UseGuards(JwtAuthGuard)
  @Get('me/questions')
  listMyQuestions(@Req() req: AuthedRequest) {
    const userId = Number(req.user?.sub)
    return this.usersService.listQuestionsByUser(userId)
  }

  @Get('me/answers')
  @UseGuards(JwtAuthGuard)
  getMyAnswers(@Req() req: AuthedRequest) {
    const userId = Number(req.user?.sub);
    return this.usersService.getMyAnswers(userId);
  }
}
