import { Injectable, BadRequestException, Optional } from '@nestjs/common';
import { RedisService } from "../../infrastructure/redis/redis.service";
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { EventsService } from '../events/events.service';

// Helper function to pick Redis client (same as in questions service)

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    @Optional() private readonly redis?: RedisService,
  ) {}

  async purgeCache(scope: string, slug?: string): Promise<{ ok: boolean; clearedKeys?: string[] }> {
    try {
      const r = this.redis?.client;
      if (!r?.del) {
        return { ok: false };
      }

      let keys: string[] = [];

      if (scope === 'define' && slug) {
        // Purge concept-specific cache
        keys = [
          `concept:${slug}`,
          `concept:${slug}:questions`,
          `concept:${slug}:keywords`,
          `concept:${slug}:graph`,
        ];
      } else if (scope === 'all') {
        // For full cache purge, we'd need to scan all keys
        // For now, implement basic concept cache purging
        keys = [`concept:*`, `daily:*`];
      }

      if (keys.length > 0) {
        const clearedKeys: string[] = [];
        for (const key of keys) {
          try {
            const result = await r.del(key);
            if (result > 0) {
              clearedKeys.push(key);
            }
          } catch (error) {
            // Individual key deletion failure is not critical
          }
        }
        return { ok: true, clearedKeys };
      }

      return { ok: false };
    } catch (error) {
      return { ok: false };
    }
  }

  async updateTop5Questions(conceptSlug: string, questionIds: number[]): Promise<{ ok: boolean; error?: string }> {
    try {
      // Validate input
      if (!questionIds || questionIds.length === 0 || questionIds.length > 5) {
        throw new BadRequestException('Question IDs must be between 1 and 5 items');
      }

      // Find concept by slug
      const concept = await this.prisma.concept.findUnique({
        where: { slug: conceptSlug }
      });

      if (!concept) {
        throw new BadRequestException(`Concept with slug '${conceptSlug}' not found`);
      }

      // Verify all questions exist
      const questions = await this.prisma.question.findMany({
        where: { id: { in: questionIds } },
        select: { id: true }
      });

      if (questions.length !== questionIds.length) {
        const foundIds = questions.map(q => q.id);
        const missingIds = questionIds.filter(id => !foundIds.includes(id));
        throw new BadRequestException(`Questions not found: ${missingIds.join(', ')}`);
      }

      return await this.prisma.$transaction(async (tx) => {
        // Delete existing top questions for this concept
        await tx.topQuestion.deleteMany({
          where: { conceptId: concept.id }
        });

        // Insert new top questions in given order as ranks 1..N
        const topQuestions = questionIds.map((questionId, index) => ({
          conceptId: concept.id,
          questionId: questionId,
          rank: index + 1,
        }));

        await tx.topQuestion.createMany({
          data: topQuestions
        });

        // Purge cache for this slug
        await this.purgeConceptCache(conceptSlug, concept.id);

        // Emit 'define.updated' event
        this.eventsService.emitConceptUpdate(conceptSlug, {
          action: 'top5-updated',
          conceptId: concept.id,
          questionIds: questionIds,
        });

        return { ok: true };
      });

    } catch (error) {
      if (error instanceof BadRequestException) {
        return { ok: false, error: error.message };
      }
      return { ok: false, error: 'Failed to update top 5 questions' };
    }
  }

  private async purgeConceptCache(conceptSlug: string, conceptId: number) {
    try {
      const r = this.redis?.client;
      if (r?.del) {
        const keys = [
          `define:${conceptSlug}:keywords`,
          `define:${conceptSlug}:top5`,
          `concept:${conceptSlug}`,
          `concept:${conceptSlug}:questions`,
          `concept:${conceptSlug}:keywords`,
          `concept:${conceptSlug}:graph`,
          `concept:${conceptId}:keywords`,
          `concept:${conceptId}:top5`,
        ];

        await Promise.all(keys.map(key => r.del(key).catch(() => {})));
      }
    } catch {
      // Redis error is non-fatal
    }
  }
}
