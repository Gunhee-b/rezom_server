import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class DefineService {
  constructor(private readonly prisma: PrismaService) {}

  async getTop5Questions(conceptSlug: string) {
    const concept = await this.prisma.concept.findUnique({
      where: { slug: conceptSlug }
    });

    if (!concept) {
      return [];
    }

    const topQuestions = await this.prisma.topQuestion.findMany({
      where: { conceptId: concept.id },
      orderBy: { rank: 'asc' },
      take: 5,
      include: {
        Question: true
      }
    });

    return topQuestions.map((tq, index) => ({
      questionId: tq.Question.id,
      title: tq.Question.title,
      content: tq.Question.body,
      keywordLabel: null,
      rank: tq.rank,
      tags: tq.Question.tags,
      createdAt: tq.Question.createdAt,
    }));
  }

  async updateTop5Questions(conceptSlug: string, questionIds: number[]) {
    console.log(`Updating top 5 for ${conceptSlug} with questions:`, questionIds);
    
    const concept = await this.prisma.concept.findUnique({
      where: { slug: conceptSlug }
    });

    if (!concept) {
      throw new Error(`Concept with slug ${conceptSlug} not found`);
    }

    await this.prisma.topQuestion.deleteMany({
      where: { conceptId: concept.id }
    });

    for (let i = 0; i < questionIds.length && i < 5; i++) {
      await this.prisma.topQuestion.create({
        data: {
          conceptId: concept.id,
          questionId: questionIds[i],
          rank: i + 1,
        }
      });
    }

    console.log(`Successfully updated top 5 questions for ${conceptSlug}`);
    
    return { 
      success: true, 
      message: `Updated top 5 questions for ${conceptSlug}`,
      questionIds,
      conceptId: concept.id
    };
  }

  async getKeywords(conceptSlug: string) {
    console.log(`Frontend called keywords endpoint for: ${conceptSlug}, returning questions as display items`);
    
    const concept = await this.prisma.concept.findUnique({
      where: { slug: conceptSlug }
    });

    if (!concept) {
      return [];
    }

    const topQuestions = await this.prisma.topQuestion.findMany({
      where: { conceptId: concept.id },
      orderBy: { rank: 'asc' },
      include: {
        Question: true
      }
    });

    console.log(`Found ${topQuestions.length} top questions for ${conceptSlug}`);

    return topQuestions.map((tq, index) => ({
      id: tq.Question.id,
      text: tq.Question.title,
      title: tq.Question.title,
      label: tq.Question.title,
      keyword: tq.Question.title,
      description: tq.Question.body,
      body: tq.Question.body,
      content: tq.Question.body,
      position: index + 1,
      active: true,
      conceptId: concept.id,
      questionId: tq.Question.id,
      tags: tq.Question.tags,
      createdAt: tq.Question.createdAt,
      rank: tq.rank
    }));
  }

  async getConcept(conceptSlug: string) {
    return this.prisma.concept.findUnique({
      where: { slug: conceptSlug }
    });
  }

  async getConceptQuestions(conceptSlug: string) {
    console.log(`Getting concept questions for: ${conceptSlug}`);
    
    const concept = await this.prisma.concept.findUnique({
      where: { slug: conceptSlug }
    });

    if (!concept) {
      console.log(`Concept not found: ${conceptSlug}`);
      return [];
    }

    const topQuestions = await this.prisma.topQuestion.findMany({
      where: { conceptId: concept.id },
      orderBy: { rank: 'asc' },
      include: {
        Question: true
      }
    });

    console.log(`Found ${topQuestions.length} top questions for ${conceptSlug}`);

    return topQuestions.map((tq) => ({
      id: tq.Question.id,
      title: tq.Question.title,
      body: tq.Question.body,
      tags: tq.Question.tags,
      createdAt: tq.Question.createdAt,
      authorId: tq.Question.authorId,
      categoryId: tq.Question.categoryId,
      isDaily: tq.Question.isDaily,
      updatedAt: tq.Question.updatedAt
    }));
  }

  async getQuestion(conceptSlug: string, questionId: number) {
    console.log(`Getting question ${questionId} for concept: ${conceptSlug}`);
    
    const question = await this.prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      console.log(`Question not found: ${questionId}`);
      return null;
    }

    console.log(`Found question: ${question.title}`);

    return {
      id: question.id,
      title: question.title,
      body: question.body,
      content: question.body,
      tags: question.tags,
      createdAt: question.createdAt,
      authorId: question.authorId,
      categoryId: question.categoryId,
      isDaily: question.isDaily,
      updatedAt: question.updatedAt
    };
  }

  async updateKeywords(conceptSlug: string, body: any) {
    console.log(`Updating keywords for ${conceptSlug}:`, body);
    return { success: true, message: 'Keywords updated' };
  }
}
