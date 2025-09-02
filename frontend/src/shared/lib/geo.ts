export type Pt = { x: number; y: number };

export const mapPercentToPx = (v: number, size: number) => (v / 100) * size;

export function quadPath(a: Pt, b: Pt, k: number) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.y - a.y;
  const dy = a.x - b.x;
  const cx = mx + dx * k;
  const cy = my + dy * k;
  return `M ${a.x},${a.y} Q ${cx},${cy} ${b.x},${b.y}`;
}