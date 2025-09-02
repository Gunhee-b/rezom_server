// src/atoms/LogoText.tsx
import React from 'react';
import { TOKENS } from '@/shared/theme/tokens';

export function LogoText({
  size = TOKENS.typography.logo.size,
  weight = TOKENS.typography.logo.weight,
  role = 'logo-text',
}: { size?: number; weight?: number; role?: string }) {
  return (
    <text
      data-role={role}
      textAnchor="middle"
      style={{ fontSize: size, fontWeight: weight, fill: TOKENS.colors.ink }}
    >
      ReZom
    </text>
  );
}