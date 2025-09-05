// src/shared/theme/tokens.ts

export type EdgeKind = 'green' | 'brown' | 'thin' | 'default';

export const TOKENS = {
  colors: { ink:'#1F2937', gray:'#9CA3AF', white:'#fff', green:'#15803D', brown:'#5D4037' },
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
      green:  { stroke: '#15803D', width: 6 },
      brown:  { stroke: '#5D4037', width: 6 },
      thin:   { stroke: '#D1D5DB', width: 1.5 },
      default:{ stroke: '#D1D5DB', width: 1.5 },
    },
  },

  curve: { k: 0.18 }, // 기본 곡률

  typography: { logo: { size: 56, weight: 800 } },

  animation: { vineDraw: 0.9 },
} as const;