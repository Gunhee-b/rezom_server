import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuestionDto, authorId: number) {
    // Use 'content' field if provided, otherwise use 'body'
    const bodyText = dto.content || dto.body || '';
    
    // Map conceptSlug to categoryId if conceptSlug is provided
    let categoryId = dto.categoryId || 1;
    if (dto.conceptSlug) {
      // Map concept slugs to category IDs based on your business logic
      const conceptToCategoryMap: Record<string, number> = {
        'language-definition': 1, // Philosophy
        'description': 2, // Economics  
        'social-analysis': 4, // Society
      };
      categoryId = conceptToCategoryMap[dto.conceptSlug] || 1;
    }
    
    return this.prisma.question.create({
      data: {
        title: dto.title,
        body: bodyText,  // Now uses the content from frontend
        authorId,
        categoryId,
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

  async getDailyQuestion() {
    // Get a random question from the database
    const count = await this.prisma.question.count();
    if (count === 0) {
      return { question: "What defines your purpose today?" };
    }
    
    const randomOffset = Math.floor(Math.random() * count);
    const question = await this.prisma.question.findMany({
      skip: randomOffset,
      take: 1,
      select: {
        id: true,
        title: true,
        body: true,
      }
    });
    
    if (question.length > 0) {
      return { question: question[0] };
    }
    
    return { question: "What defines your purpose today?" };
  }

  async update(id: number, dto: UpdateQuestionDto) {
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.body !== undefined) updateData.body = dto.body;
    if (dto.content !== undefined) updateData.body = dto.content; // Map content to body
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    
    return this.prisma.question.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    // First delete related answers and comments
    await this.prisma.answer.deleteMany({
      where: { questionId: id }
    });
    
    // Then delete the question
    return this.prisma.question.delete({
      where: { id },
    });
  }
}
