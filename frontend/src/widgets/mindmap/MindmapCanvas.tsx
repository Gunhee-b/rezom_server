// src/widgets/mindmap/MindmapCanvas.tsx
import React, { memo, useMemo } from 'react';
import type { ViewSchema } from './types';
import { Edges } from './Edges';
import { Nodes } from './Nodes';
import { mapPercentToPx, Pt } from '@/shared/lib/geo';

type Props = { 
  schema: ViewSchema; 
  interactive?: boolean;
  onNodeClick?: (nodeId: string, nodeData?: any) => void;
};

const W = 1000;
const H = 700;

export const MindmapCanvas = memo(function MindmapCanvas({ schema, onNodeClick }: Props) {
  const map = (p: { x: number; y: number }) => ({
    x: mapPercentToPx(p.x, W),
    y: mapPercentToPx(p.y, H),
  });

  // id → 좌표 인덱스 + 존재 체크
  const { getOpt, hasId } = useMemo(() => {
    const idx = new Map<string, Pt>();
    for (const n of schema.nodes) idx.set(n.id, map({ x: n.x, y: n.y }));
    return {
      getOpt: (id: string): Pt | undefined => idx.get(id),
      hasId: (id: string) => idx.has(id),
    };
  }, [schema.nodes]);

  return (
    // <div className="relative w-full h-[80vh]">
    <div className="relative" style={{ width: '100%', height: '80vh', background: 'transparent' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        data-canvas-root
        aria-label={schema.background ?? 'mindmap'}
      >
        {/* edges (존재하는 id만 그리도록) */}
        <Edges edges={schema.edges} getOpt={getOpt} hasId={hasId} />

        {/* nodes */}
        <Nodes nodes={schema.nodes} map={map} onNodeClick={onNodeClick} />
      </svg>
    </div>
  );
});