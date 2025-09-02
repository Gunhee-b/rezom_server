type Props = { rx: number; ry: number; stroke?: string; strokeWidth?: number; fill?: string };
export function Oval({ rx, ry, stroke='#9E9E9E', strokeWidth=3, fill='white' }: Props) {
  return <ellipse rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
}