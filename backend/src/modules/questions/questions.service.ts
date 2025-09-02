import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuestionDto, authorId: number) {
    // Use 'content' field if provided, otherwise use 'body'
    const bodyText = dto.content || dto.body || '';
    
    return this.prisma.question.create({
      data: {
        title: dto.title,
        body: bodyText,  // Now uses the content from frontend
        authorId,
        categoryId: dto.categoryId || 1,
        tags: dto.tags || [],
        isDaily: dto.isDaily || false,
        updatedAt: new Date(),
      },
    });
  }

  async findAll(categoryId?: number) {
    return this.prisma.question.findMany({
      where: categoryId ? { categoryId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.question.findUnique({
      where: { id },
    });
  }
}
