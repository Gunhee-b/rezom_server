import React, { memo } from 'react';
import { motion } from 'framer-motion';
import type { Node } from './types';
import { TOKENS } from '@/shared/theme/tokens';
import { MindNode } from '@/molecules/MindNode';
import { Logo } from '@/atoms/Logo';
import { resolveLink } from '@/shared/schema/rules';

type Props = {
  nodes: Node[];
  map: (p: { x: number; y: number }) => { x: number; y: number }; // % → px
  onNodeClick?: (nodeId: string, nodeData?: any) => void;
};

export const Nodes = memo(function Nodes({ nodes, map, onNodeClick }: Props) {
  return (
    <>
      {nodes.map((n) => {
        const p = map({ x: n.x, y: n.y });

        const content =
          n.kind === 'logo' ? (
            <Logo as="svg" roleAttr="logo-text" />
          ) : n.kind === 'label' ? (
            <text
              textAnchor="middle"
              style={{
                fontSize: (n as any).fontSize ?? TOKENS.node.label.size,
                fontWeight: (n as any).fontWeight ?? TOKENS.node.label.weight,
                fill: TOKENS.colors.ink,
              }}
            >
              {(n.label ?? '').split('\n').map((ln, i) => (
                <tspan key={i} x={0} dy={i === 0 ? 0 : TOKENS.node.label.lineHeight}>
                  {ln}
                </tspan>
              ))}
            </text>
          ) : (
            <MindNode r={TOKENS.node.radius[n.size ?? 'md']} label={n.label} />
          );

        const inner = (
          <motion.g
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            <g transform={`translate(${p.x}, ${p.y})`}>{content}</g>
          </motion.g>
        );

        const handleClick = (e: React.MouseEvent) => {
          if (onNodeClick && !n.disabled) {
            e.preventDefault();
            e.stopPropagation();
            // Extract node data attributes for click handling
            const nodeData = Object.keys(n).reduce((acc, key) => {
              if (key.startsWith('data-')) {
                acc[key] = (n as any)[key];
              }
              return acc;
            }, {} as any);
            onNodeClick(n.id, nodeData);
          }
        };

        return (
          <g key={n.id} data-node-id={n.id}>
            {n.to && !n.disabled && !onNodeClick ? (
              <a href={resolveLink(n.to)} aria-label={n.ariaLabel || n.label}>
                {inner}
              </a>
            ) : onNodeClick && !n.disabled ? (
              <g 
                onClick={handleClick} 
                style={{ cursor: 'pointer' }}
                aria-label={n.ariaLabel || n.label}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleClick(e as any);
                  }
                }}
              >
                {inner}
              </g>
            ) : (
              inner
            )}
          </g>
        );
      })}
    </>
  );
});