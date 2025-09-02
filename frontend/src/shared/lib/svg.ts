export const mapPerc = (v: number, size: number) => (v / 100) * size;

export type Pt = { x: number; y: number };

export const quadPath = (a: Pt, b: Pt, k = 0) => {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.y - a.y,       dy = a.x - b.x;
  const cx = mx + dx * k,     cy = my + dy * k;
  return `M ${a.x},${a.y} Q ${cx},${cy} ${b.x},${b.y}`;
};