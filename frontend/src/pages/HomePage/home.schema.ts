import type { ViewSchema } from '@/widgets/mindmap/types';

export const homeSchema: ViewSchema = {
  nodes: [
    { id: 'logo', kind: 'logo', x: 50, y: 55 },

    // 일반 노드는 kind 생략(=ellipse)
    { id: 'about',  label: 'About',                 x: 20, y: 18, size: 'md', to: '/about' },
    { id: 'define',   label: 'Language\ndefinition',  x: 12, y: 62, size: 'md', to: '/define' },
    { id: 'todays', label: "Today's\nQuestion",     x: 45, y: 30, size: 'md', to: '/todays-question' },
    { id: 'metaphor', label: 'Description\nby Metaphor', x: 80, y: 12, size: 'md', to: '/metaphor' },
    { id: 'analyze',  label: 'Analyzing\nthe World', x: 88, y: 40, size: 'md', to: '/analyze' },
    { id: 'free',     label: 'Free Insight',        x: 22, y: 82, size: 'md', to: '/free-insight' },
    { id: 'profile',  label: 'Profile',             x: 60, y: 78, size: 'md', to: '/profile' },
    { id: 'reco',     label: 'Recommended\nQuestions', x: 83, y: 86, size: 'md', to: '/recommend' },
  ],
  edges: [
    { id: 'vine',   from: 'todays', to: 'profile', style: 'green', curvature: 0.22 },
    { id: 'line-1', from: 'todays', to: 'analyze', style: 'thin',  curvature: 0.25 },
    { id: 'line-2', from: 'todays', to: 'about',   style: 'thin',  curvature: -0.25 },
    { id: 'line-3', from: 'profile', to: 'reco',   style: 'thin',  curvature: 0.2 },
    { id: 'line-4', from: 'about',   to: 'define',   style: 'thin',  curvature: 0.35 },
    { id: 'line-5', from: 'free',    to: 'profile',style: 'thin',  curvature: -0.25 },
  ],
};