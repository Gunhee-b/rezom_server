// src/pages/DefineTopic/makeDefineSchema.ts
import type { ViewSchema } from '@/widgets/mindmap/types';
import { idFor } from '@/shared/schema/rules';

export interface ConceptKeyword {
  id: number;
  keyword: string;
  position: number;
  active: boolean;
  currentQuestionId: number | null;
}

export interface KeywordQuestion {
  id: number;
  title: string;
  body: string;
  tags: string[] | null;
  isDaily: boolean;
}

/**
 * Creates a define graph schema with:
 * - Center node: fixed "Definition" text
 * - Surrounding nodes: Top-5 admin-curated keywords
 * - Write node: connected to center with current question context
 */
export function makeDefineSchema(
  conceptSlug: string, 
  keywords: ConceptKeyword[], 
  currentQuestion?: KeywordQuestion
): ViewSchema {
  const P = 'define';
  
  // Center node is always "Definition"
  const centerNode = {
    id: idFor(P, 'center'),
    x: 50, // Center position
    y: 40, // Slightly above center
    label: 'Definition',
    size: 'lg' as const,
  };

  // Get top 5 active keywords, positioned around the center
  const activeKeywords = keywords.filter(k => k.active).slice(0, 5);
  const keywordPositions = [
    { x: 20, y: 20 }, // Top-left
    { x: 80, y: 20 }, // Top-right
    { x: 85, y: 60 }, // Right
    { x: 50, y: 80 }, // Bottom
    { x: 15, y: 60 }, // Left
  ];

  const keywordNodes = activeKeywords.map((keyword, index) => {
    const pos = keywordPositions[index] || { x: 50, y: 70 };
    return {
      id: idFor(P, `keyword-${keyword.id}`),
      x: pos.x,
      y: pos.y,
      label: keyword.keyword,
      size: 'md' as const,
      // Store keyword data for click handling
      'data-keyword-id': keyword.id.toString(),
      'data-question-id': keyword.currentQuestionId?.toString() || '',
    };
  });

  // Write node - positioned bottom-left, carries current question context
  const currentQuestionParam = currentQuestion 
    ? `?questionId=${currentQuestion.id}`
    : `?concept=${conceptSlug}`;
    
  const writeNode = {
    id: idFor(P, 'write'),
    x: 25,
    y: 75,
    label: 'Write',
    size: 'sm' as const,
    to: `/write${currentQuestionParam}`,
  };

  // Create edges from center to all keyword nodes
  const keywordEdges = keywordNodes.map(node => ({
    id: idFor(P, `edge-${node.id}`),
    from: centerNode.id,
    to: node.id,
    style: 'thin' as const,
    curvature: 0.1,
  }));

  // Edge from write to center
  const writeEdge = {
    id: idFor(P, 'write-edge'),
    from: writeNode.id,
    to: centerNode.id,
    style: 'green' as const,
    curvature: 0.15,
  };

  return {
    background: 'Define Graph',
    nodes: [centerNode, ...keywordNodes, writeNode],
    edges: [...keywordEdges, writeEdge],
  };
}