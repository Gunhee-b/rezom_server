// src/pages/Define/define.schema.ts
import type { ViewSchema } from '@/widgets/mindmap/types';
import { idFor } from '@/shared/schema/rules';

const P = 'def';

export const defineSchema: ViewSchema = {
  nodes: [
    { id: idFor(P,'title'), x: 50, y: 48, label: 'Language\ndefinition', size: 'lg' },
    { id: idFor(P,'happiness'), x: 12, y: 18, label: 'Happiness', size: 'sm', to: '/define/happiness' },
    { id: idFor(P,'success'),   x: 52, y: 10, label: 'Success',   size: 'sm', to: '/define/success' },
    { id: idFor(P,'art'),       x: 86, y: 28, label: 'Art',       size: 'sm', to: '/define/art' },
    { id: idFor(P,'obsession'), x: 26, y: 78, label: 'Obsession', size: 'sm', to: '/define/obsession' },
    { id: idFor(P,'direction'), x: 86, y: 78, label: 'Direction', size: 'sm', to: '/define/direction' },
  ],
  edges: [
    { id: idFor(P,'vine1'), from: idFor(P,'obsession'), to: idFor(P,'title'), style: 'green', curvature: 0.16 },
    { id: idFor(P,'vine2'), from: idFor(P,'title'),     to: idFor(P,'art'),   style: 'green', curvature: 0.12 },
    { id: idFor(P,'thin1'), from: idFor(P,'happiness'), to: idFor(P,'title'), style: 'thin',  curvature: -0.08 },
    { id: idFor(P,'thin2'), from: idFor(P,'direction'), to: idFor(P,'title'), style: 'thin',  curvature: 0.10 },
    { id: idFor(P,'thin3'), from: idFor(P,'success'),   to: idFor(P,'art'),   style: 'thin',  curvature: -0.06 },
  ],
};