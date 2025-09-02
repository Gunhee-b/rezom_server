import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(authorId: number, dto: any) {
    if (!dto.questionId && !dto.answerId) throw new BadRequestException('questionId or answerId required');
    return this.prisma.comment.create({ data: { ...dto, authorId } });
  }
}