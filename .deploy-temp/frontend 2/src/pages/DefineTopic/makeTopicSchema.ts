// src/pages/DefineTopic/makeTopicSchema.ts
import type { ViewSchema } from '@/widgets/mindmap/types';
import { TOKENS } from '@/shared/theme/tokens';
import { idFor } from '@/shared/schema/rules';

export function makeTopicSchema(topicLabel: string, question: string, others: string[]): ViewSchema {
  const P = 'topic';
  const clean = (s: string) => s.replace(/^Title\s*:?\s*/i, '').trim();

  const o1 = clean(others[0] ?? '');
  const o2 = clean(others[1] ?? '');
  const o3 = clean(others[2] ?? '');

  return {
    nodes: [
      { id: idFor(P,'topic'),   x: 16, y: 20, label: topicLabel, size: 'lg' },
      { id: idFor(P,'question'),x: 76, y: 28, label: `"${question}"`, size: 'lg' },
      { id: idFor(P,'qLabel'),  kind: 'label', x: 76, y: 18, label: 'Q', fontSize: TOKENS.typography.logo.size, fontWeight: 800 },
      { id: idFor(P,'othersT'), kind: 'label', x: 68, y: 56, label: "Other’s", fontSize: TOKENS.typography.logo.size * 0.6, fontWeight: 800 },

      { id: idFor(P,'o1'), x: 58, y: 78, label: o1, size: 'sm' },
      { id: idFor(P,'o2'), x: 74, y: 74, label: o2, size: 'sm' },
      { id: idFor(P,'o3'), x: 88, y: 80, label: o3, size: 'sm' },

      { id: idFor(P,'write'), x: 18, y: 80, label: 'Write', size: 'sm', to: `/write?q=${encodeURIComponent(question)}` },
    ],
    edges: [
      { id: idFor(P,'thin1'), from: idFor(P,'topic'), to: idFor(P,'question'), style: 'thin',  curvature: 0.15 },
      { id: idFor(P,'vine'),  from: idFor(P,'write'), to: idFor(P,'question'), style: 'green', curvature: -0.22 },
      { id: idFor(P,'thin2'), from: idFor(P,'othersT'), to: idFor(P,'o1'), style: 'thin', curvature: -0.10 },
      { id: idFor(P,'thin3'), from: idFor(P,'othersT'), to: idFor(P,'o2'), style: 'thin', curvature: 0.08 },
      { id: idFor(P,'thin4'), from: idFor(P,'othersT'), to: idFor(P,'o3'), style: 'thin', curvature: -0.06 },
    ],
  };
}