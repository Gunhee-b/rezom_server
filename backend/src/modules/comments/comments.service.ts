import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: number, dto: any) {
    if (!dto.questionId && !dto.answerId) throw new BadRequestException('questionId or answerId required');
    return this.prisma.comment.create({ 
      data: { ...dto, authorId },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        }
      }
    });
  }

  async getByAnswerId(answerId: number) {
    return this.prisma.comment.findMany({
      where: { answerId },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  async getByQuestionId(questionId: number) {
    return this.prisma.comment.findMany({
      where: { questionId },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  async findOne(id: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        }
      }
    });
    
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    
    return comment;
  }

  async update(id: number, dto: { body: string }) {
    return this.prisma.comment.update({
      where: { id },
      data: { body: dto.body },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        }
      }
    });
  }

  async remove(id: number) {
    return this.prisma.comment.delete({
      where: { id }
    });
  }
}