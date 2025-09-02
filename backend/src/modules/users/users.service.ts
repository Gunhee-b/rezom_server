import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../infrastructure/prisma/prisma.service'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listQuestionsByUser(userId: number) {
    return this.prisma.question.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, body: true, authorId: true, createdAt: true },
    })
  }

  async getMyAnswers(userId: number) {
    return this.prisma.answer.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        body: true,
        questionId: true,
        createdAt: true,
        Question: {
          select: { id: true, title: true }
        }
      },
    });
  }
}
