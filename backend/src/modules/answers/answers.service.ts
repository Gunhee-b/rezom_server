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

  async findOne(id: number) {
    return this.prisma.answer.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, email: true }
        },
        Question: {
          select: { 
            id: true, 
            title: true,
            QuestionConcept: {
              select: {
                Concept: {
                  select: {
                    slug: true,
                    title: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  async update(id: number, dto: any) {
    const now = new Date();
    return this.prisma.answer.update({
      where: { id },
      data: {
        title: dto.title || null,
        body: dto.body,
        updatedAt: now
      },
      include: {
        User: {
          select: { id: true, email: true }
        }
      }
    });
  }

  async remove(id: number) {
    return this.prisma.answer.delete({
      where: { id }
    });
  }
}
