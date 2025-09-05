// src/atoms/EdgePath.tsx
import React from 'react';
import { TOKENS, type EdgeKind } from '@/shared/theme/tokens';

export function EdgePath({ d, kind }: { d: string; kind: EdgeKind }) {
  const s = TOKENS.edge[kind];
  return (
    <path d={d} fill="none" stroke={s.color} strokeWidth={s.width} strokeLinecap="round" />
  );
}