import React from 'react';
import { TOKENS } from '@/shared/theme/tokens';
import { wrapLabelToEllipse } from '@/shared/lib/text';

type Props = {
  r: number;
  label?: string;
  /** 기본 true: 타원 밖으로 나가면 자동 줄바꿈 */
  autoWrap?: boolean;
  /** 폰트 크기 오버라이드(선택) */
  fontPx?: number;
};

export function MindNode({ r, label, autoWrap = true, fontPx }: Props) {
  const fontSize = fontPx ?? TOKENS.node.label.size;
  const lines = (() => {
    if (!label) return [];
    if (!autoWrap) return label.split('\n');
    return wrapLabelToEllipse(label, r, fontSize, {
      paddingRatio: 0.9,
      avgCharRatio: 0.58,
      maxLines: 4,
    });
  })();

  const lh = TOKENS.node.label.lineHeight;
  const blockHeight = lines.length * lh;
  const startY = -blockHeight / 2 + lh / 2;

  return (
    <g>
      <ellipse
        rx={r}
        ry={r * 0.7}
        fill={TOKENS.colors.white}
        stroke={TOKENS.colors.gray}
        strokeWidth={TOKENS.node.strokeWidth}
      />
      {lines.length > 0 && (
        <text
          textAnchor="middle"
          style={{ fontSize, fontWeight: TOKENS.node.label.weight, fill: TOKENS.colors.ink }}
        >
          {lines.map((ln, i) => (
            <tspan key={i} x={0} y={startY + i * lh}>
              {ln}
            </tspan>
          ))}
        </text>
      )}
    </g>
  );
}