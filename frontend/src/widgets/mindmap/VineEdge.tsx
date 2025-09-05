import React from 'react';
import { Pt } from '@/shared/lib/svg';

type Props = {
  from: Pt;
  to: Pt;
  curvature?: number;
};

export function VineEdge({ from, to, curvature = 0.18 }: Props) {
  // Calculate the angle and distance for vine placement
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Calculate midpoint for vine placement
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  
  // Scale the vine based on distance
  const scaleY = distance / 397; // Scale based on vine height
  const scaleX = scaleY * 0.6; // Keep proportional width
  
  // The vine SVG is vertical, so we need to rotate it by angle - 90 degrees
  const rotationAngle = angle - 90;
  
  return (
    <g transform={`translate(${midX}, ${midY}) rotate(${rotationAngle})`}>
      <image
        href="/vine.svg"
        x={-110 * scaleX} // Center the vine horizontally
        y={-198.5 * scaleY} // Center the vine vertically
        width={220 * scaleX}
        height={397 * scaleY}
        preserveAspectRatio="xMidYMid meet"
        opacity={0.7}
      />
    </g>
  );
}