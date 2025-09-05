// src/molecules/CurvedEdge.tsx
import React from 'react';
import { quadPath, Pt } from '@/shared/lib/svg';
import { EdgePath } from '@/atoms/EdgePath';
import type { EdgeKind } from '@/shared/theme/tokens';

export default function CurvedEdge({ a, b, k = 0, kind }: { a: Pt; b: Pt; k?: number; kind: EdgeKind }) {
  return <EdgePath d={quadPath(a, b, k)} kind={kind} />;
}