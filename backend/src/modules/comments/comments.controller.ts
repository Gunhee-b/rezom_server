import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common'
import { CommentsService } from './comments.service'
import { CreateCommentDto } from './dto/create-comment.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Request } from 'express'

type AuthedRequest = Request & { user?: { sub: number } }

@Controller('comments')
export class CommentsController {
  constructor(private readonly svc: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateCommentDto) {
    const userId = Number(req.user?.sub)
    return this.svc.create(userId, dto)
  }
}
