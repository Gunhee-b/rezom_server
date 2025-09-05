import type { ViewSchema } from '@/widgets/mindmap/types';

export const homeSchema: ViewSchema = {
  nodes: [
    { id: 'logo', kind: 'logo', x: 50, y: 50 },

    // 일반 노드는 kind 생략(=ellipse) - Figma 디자인에 맞춰 위치 조정
    { id: 'about',    label: 'About',                   x: 20, y: 15, size: 'md', to: '/about', disabled: true },
    { id: 'define',   label: 'Language\ndefinition',    x: 15, y: 45, size: 'md', to: '/define' },
    { id: 'todays',   label: "Today's\nQuestion",       x: 40, y: 25, size: 'md', to: '/todays-question' },
    { id: 'metaphor', label: 'Description\nby Metaphor', x: 75, y: 15, size: 'md', to: '/metaphor', disabled: true },
    { id: 'analyze',  label: 'Analyzing\nthe World',    x: 85, y: 45, size: 'md', to: '/analyze' },
    { id: 'free',     label: 'Free Insight',            x: 20, y: 75, size: 'md', to: '/free-insight' },
    { id: 'profile',  label: 'Profile',                 x: 55, y: 70, size: 'md', to: '/users/me' },
    { id: 'reco',     label: 'Recommended\nQuestions',  x: 80, y: 75, size: 'md', to: '/recommend', disabled: true },
  ],
  edges: [
    // Green vines connecting nodes vertically (as shown in Figma)
    { id: 'vine-1', from: 'todays', to: 'logo', style: 'green', curvature: 0.05 },
    { id: 'vine-2', from: 'logo', to: 'profile', style: 'green', curvature: 0.05 },
    
    // Thin gray lines connecting nodes
    { id: 'line-1', from: 'about', to: 'define',   style: 'thin', curvature: 0.2 },
    { id: 'line-2', from: 'todays', to: 'metaphor', style: 'thin', curvature: 0.15 },
    { id: 'line-3', from: 'metaphor', to: 'analyze', style: 'thin', curvature: 0.2 },
    { id: 'line-4', from: 'profile', to: 'reco',    style: 'thin', curvature: 0.15 },
    { id: 'line-5', from: 'free', to: 'profile',    style: 'thin', curvature: -0.2 },
    { id: 'line-6', from: 'analyze', to: 'reco',    style: 'thin', curvature: 0.18 },
  ],
};