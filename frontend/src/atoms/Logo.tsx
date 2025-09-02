// src/atoms/Logo.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { TOKENS } from '@/shared/theme/tokens';

type BaseProps = {
  /** 클릭 시 이동할 경로. 기본 '/' */
  to?: string;
  /** 폰트 크기(px). 기본: TOKENS.typography.logo.size */
  size?: number;
  /** 폰트 두께. 기본: TOKENS.typography.logo.weight */
  weight?: number;
};

type SvgProps = BaseProps & {
  as: 'svg';
  /** SVG 로고에서 실측용 data-role. 기본 'logo-text' */
  roleAttr?: string;
  /** 추가 className (선택) */
  className?: string;
};

type DomProps = BaseProps & {
  as?: 'dom';
  className?: string;
};

export function Logo(props: SvgProps | DomProps) {
  const {
    to = '/',
    size = TOKENS.typography.logo.size,
    weight = TOKENS.typography.logo.weight,
  } = props;

  if (props.as === 'svg') {
    const roleAttr = props.roleAttr ?? 'logo-text';
    return (
      // SVG 네임스페이스에서는 <Link> 대신 <a href> 사용
      <a href={to} className={props.className}>
        <text
          data-role={roleAttr}
          textAnchor="middle"
          style={{ fontSize: size, fontWeight: weight, fill: TOKENS.colors.ink }}
        >
          ReZom
        </text>
      </a>
    );
  }

  // DOM 모드: SPA 네비게이션
  return (
    <Link to={to} className={props.className}>
      <span style={{ fontSize: size, fontWeight: weight, color: TOKENS.colors.ink }}>
        ReZom
      </span>
    </Link>
  );
}