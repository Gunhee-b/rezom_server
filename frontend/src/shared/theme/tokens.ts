// src/shared/theme/tokens.ts

export type EdgeKind = 'green' | 'brown' | 'thin' | 'default';

export const TOKENS = {
  colors: { ink:'#111', gray:'#9E9E9E', white:'#fff', green:'#1B5E20', brown:'#5D4037' },
  viewBox: { w: 1000, h: 700 },

  node: {
    radius: { sm: 70, md: 95, lg: 120 },
    strokeWidth: 3,
    label: { size: 18, lineHeight: 22, weight: 600 },
    // ✅ 자동 줄바꿈 규칙 (사이즈별)
    wrap: {
      sm: { maxLines: 3, paddingRatio: 0.9, avgCharRatio: 0.58 },
      md: { maxLines: 4, paddingRatio: 0.9, avgCharRatio: 0.58 },
      lg: { maxLines: 5, paddingRatio: 0.9, avgCharRatio: 0.58 },
    },
  },

  edge: {
    map: {
      green:  { stroke: '#1B5E20', width: 8 },
      brown:  { stroke: '#5D4037', width: 8 },
      thin:   { stroke: '#9E9E9E', width: 2 },
      default:{ stroke: '#9E9E9E', width: 2 },
    },
  },

  curve: { k: 0.18 }, // 기본 곡률

  typography: { logo: { size: 56, weight: 800 } },

  animation: { vineDraw: 0.9 },
} as const;