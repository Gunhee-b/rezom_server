import type { ViewSchema } from '@/widgets/mindmap/types';

export const profileSchema: ViewSchema = {
  nodes: [
    { id: 'title', kind: 'logo', x: 50, y: 50 },
    { id: 'about', x: 18, y: 28, label: 'About me :', size: 'lg' },
    { id: 'nick',  x: 82, y: 22, label: 'Nickname', size: 'sm' },
    { id: 'job',   x: 26, y: 72, label: 'My job',   size: 'sm' },
    { id: 'writing', x: 84, y: 70, label: 'My writing :', size: 'lg', to: '/users/me' },
  ],
  edges: [
    { id: 'e1', from: 'about', to: 'title', style: 'thin', curvature: -0.08 },
    { id: 'e2', from: 'title', to: 'writing', style: 'thin', curvature: 0.12 },
    { id: 'e3', from: 'about', to: 'job', style: 'thin', curvature: 0.25 },
    // 중앙을 가로지르는 굵은 초록선 한 줄
    { id: 'vine', from: 'about', to: 'writing', style: 'green', curvature: 0.16 },
  ],
};