import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class AnswersService {
  constructor(private readonly prisma: PrismaService) {}

  create(authorId: number, dto: any) {
    const now = new Date();
    return this.prisma.answer.create({ 
      data: { 
        questionId: dto.questionId,
        title: dto.title || null,
        body: dto.body,
        authorId,
        updatedAt: now
      } 
    });
  }

  async getByQuestionId(questionId: number) {
    return this.prisma.answer.findMany({
      where: { questionId },
      include: {
        User: {
          select: { id: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
