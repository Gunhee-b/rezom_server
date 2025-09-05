// 공통 좌표 타입 (0–100 퍼센트 좌표를 사용)
export type Percent = number; // 0~100 범위를 의도
export type Point = { x: Percent; y: Percent };

/** 공통 노드 베이스 */
export interface NodeBase extends Point {
  id: string;
  /** 클릭 시 이동할 라우트(선택) */
  to?: string;
  /** 접근성용 라벨(선택. 없으면 label 사용) */
  ariaLabel?: string;
  /** 상호작용 비활성화 플래그(선택) */
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

/** 일반 타원 노드: 라벨/사이즈가 있을 수도, 없을 수도 있음 */
export interface EllipseNode extends NodeBase {
  /** kind가 없거나 'ellipse'면 일반 노드로 취급 */
  kind?: 'ellipse';
}

/** 로고 노드: 화면 중앙의 로고 텍스트 전용. 라벨/사이즈 불필요 */
export interface LogoNode extends NodeBase {
  kind: 'logo';
}

/** 텍스트만 렌더하는 라벨 노드 */
export interface LabelNode extends NodeBase {
  kind: 'label';
  /** 표시할 텍스트 (label 사용) */
  label: string;           // 라벨은 필수
  fontSize?: number;       // 선택: 기본값은 TOKENS.node.label.size
  fontWeight?: number;     // 선택
}

export type Node = EllipseNode | LogoNode | LabelNode;

/** 엣지 스타일 */
export type EdgeStyle = 'thin' | 'thick' | 'green' | 'brown' | 'default';

export interface Edge {
  id: string;
  from: string; // 시작 노드 id
  to: string;   // 끝 노드 id
  style: EdgeStyle;
  /** 곡률 계수(선택). 0이면 직선과 베지어의 중간 정도 */
  curvature?: number;
}

/** 한 페이지(View)를 구성하는 스키마 */
export interface ViewSchema {
  background?: string; // e.g., 'paperGloss' (접근성 라벨 등에 사용)
  nodes: Node[];
  edges: Edge[];
}

/** 타입 가드 (필요 시 사용) */
export function isLogoNode(n: Node): n is LogoNode {
  return (n as LogoNode).kind === 'logo';
}