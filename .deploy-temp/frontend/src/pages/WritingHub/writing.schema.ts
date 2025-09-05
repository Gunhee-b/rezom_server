import type { ViewSchema } from '@/widgets/mindmap/types';

/**
 * "내가 쓴 글" 허브
 * - 하단 중앙에 "I'am" 큰 타이틀
 * - 좌우에 카테고리 노드
 * - 초록/갈색 줄기로 느낌만 살린 배치
 */
export const writingHubSchema: ViewSchema = {
  nodes: [
    // 하단 타이틀 (큰 글씨 느낌을 위해 lg)
    { id: 'title', x: 50, y: 87, label: "I’m", size: 'lg' ,to: '/profile'},

    // 상단 중앙
    { id: 'metaphor', x: 50, y: 13, label: 'Description\nby Metaphor', size: 'lg', to: '/writing/metaphor' },

    // 좌측 계열
    { id: 'art',     x: 14, y: 20, label: 'Art', size: 'sm', to: '/writing/art' },
    { id: 'science', x: 42, y: 36, label: 'Science', size: 'sm', to: '/writing/science' },
    { id: 'culture', x: 12, y: 58, label: 'Culture', size: 'sm', to: '/writing/culture' },
    { id: 'lifeseed',x: 24, y: 82, label: 'Life Seed', size: 'sm', to: '/writing/lifeseed' },

    // 우측 계열
    { id: 'business', x: 85, y: 20, label: 'Business', size: 'sm', to: '/writing/business' },
    { id: 'humanity', x: 82, y: 50, label: 'Humanity', size: 'sm', to: '/writing/humanity' },
    { id: 'analyze',  x: 88, y: 74, label: 'Analyzing\nthe World', size: 'lg', to: '/writing/analyze' },
  ],
  edges: [
    // 중앙 줄기(갈색)
    { id: 'trunk_top',    from: 'metaphor', to: 'title', style: 'brown', curvature: 0.25 },

    // 좌측 초록 줄기들
    { id: 'v_l1', from: 'art',     to: 'science', style: 'green', curvature: 0.22 },
    { id: 'v_l2', from: 'science', to: 'title',   style: 'green', curvature: 0.2 },
    { id: 'v_l3', from: 'culture', to: 'lifeseed',style: 'green', curvature: 0.08 },

    // 우측 초록 줄기들
    { id: 'v_r1', from: 'business', to: 'humanity', style: 'green', curvature: -0.14 },
    { id: 'v_r2', from: 'humanity', to: 'analyze',  style: 'green', curvature: 0.18 },

    // 타이틀에서 좌우로 뻗는 가지(느낌선)
    { id: 'b_left',  from: 'title', to: 'culture',  style: 'green', curvature: -0.12 },
    { id: 'b_right', from: 'title', to: 'analyze',  style: 'green', curvature: 0.18 },
  ],
};