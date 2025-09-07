import { Body, Controller, Post, Get, Put, Delete, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common'
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

  @Get('answer/:answerId')
  getCommentsByAnswer(@Param('answerId') answerId: string) {
    return this.svc.getByAnswerId(Number(answerId));
  }

  @Get('question/:questionId')
  getCommentsByQuestion(@Param('questionId') questionId: string) {
    return this.svc.getByQuestionId(Number(questionId));
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateComment(@Param('id') id: string, @Body() dto: { body: string }, @Req() req: AuthedRequest) {
    const userId = Number(req.user?.sub);
    const commentId = Number(id);
    
    // Check if user owns this comment
    const comment = await this.svc.findOne(commentId);
    if (!comment || comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }
    
    return this.svc.update(commentId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteComment(@Param('id') id: string, @Req() req: AuthedRequest) {
    const userId = Number(req.user?.sub);
    const commentId = Number(id);
    
    // Check if user owns this comment
    const comment = await this.svc.findOne(commentId);
    if (!comment || comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    
    return this.svc.remove(commentId);
  }
}
