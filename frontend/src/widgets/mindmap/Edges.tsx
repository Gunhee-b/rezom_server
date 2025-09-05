// src/widgets/mindmap/Edges.tsx
import React, { memo } from 'react';
import type { Edge } from './types';
import { quadPath, Pt } from '@/shared/lib/geo';
import { TOKENS } from '@/shared/theme/tokens';
import { VineEdge } from './VineEdge';

type Props = {
  edges: Edge[];
  getOpt: (id: string) => Pt | undefined;
  hasId: (id: string) => boolean;
  defaultK?: number;
};

export const Edges = memo(function Edges({ edges, getOpt, hasId, defaultK = TOKENS.curve.k }: Props) {
  return (
    <>
      {edges.map((e) => {
        if (!hasId(e.from) || !hasId(e.to)) {
          // 개발 중 디버깅용 경고(앱 크래시 방지)
          console.warn('[Edges] missing node for edge:', e);
          return null;
        }
        const a = getOpt(e.from)!;
        const b = getOpt(e.to)!;
        
        // Use regular path for all styles
        const d = quadPath(a, b, e.curvature ?? defaultK);
        const style = TOKENS.edge.map[e.style ?? 'default'];

        return (
          <path
            key={e.id}
            d={d}
            fill="none"
            stroke={style.stroke}
            strokeWidth={style.width}
            strokeLinecap="round"
          />
        );
      })}
    </>
  );
});