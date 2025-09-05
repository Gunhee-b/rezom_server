// src/shared/schema/rules.ts
import { TOKENS } from '@/shared/theme/tokens';
import type { ViewSchema, Node } from '@/widgets/mindmap/types';

export type Size = 'sm' | 'md' | 'lg';

export const radiusOf = (size: Size | undefined) =>
  TOKENS.node.radius[size ?? 'md'];

export function applyDefaults(schema: ViewSchema): ViewSchema {
  // (확장 여지) 여기서 노드/엣지 공통 기본값 주입 가능
  // 예: curvature 미지정이면 TOKENS.curve.k 사용
  return {
    ...schema,
    edges: schema.edges.map(e => ({
      curvature: TOKENS.curve.k,
      ...e,
    })),
  };
}

// ID 네이밍 규칙: `page:name`
export const idFor = (page: string, name: string) => `${page}:${name}`;

// 링크 규칙(필요 시 가드 추가)
export function resolveLink(to?: string, opts?: { authed?: boolean }) {
  if (!to) return undefined;
  // 예: 로그인 필요 라우트 가드가 생긴다면 여기서 처리
  return to;
}

// 라벨 줄바꿈 규칙(사이즈별). MindNode 내부에서 이미 사용 중이면 생략 가능.
export function wrapConfigFor(node: Node) {
  const s = (node.size ?? 'md') as Size;
  return TOKENS.node.wrap[s];
}