import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateInsightDto } from './dto/create-insight.dto';
import { UpdateInsightDto } from './dto/update-insight.dto';

@Injectable()
export class InsightsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: number, dto: CreateInsightDto) {
    return this.prisma.insight.create({
      data: {
        ...dto,
        authorId,
      },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });
  }

  async findAll(authorId?: number) {
    const where = authorId ? { authorId } : {};
    return this.prisma.insight.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByUser(userId: number) {
    return this.prisma.insight.findMany({
      where: { authorId: userId },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const insight = await this.prisma.insight.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    if (!insight) {
      throw new NotFoundException('Insight not found');
    }

    return insight;
  }

  async update(id: number, dto: UpdateInsightDto) {
    return this.prisma.insight.update({
      where: { id },
      data: dto,
      include: {
        User: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    return this.prisma.insight.delete({
      where: { id },
    });
  }
}