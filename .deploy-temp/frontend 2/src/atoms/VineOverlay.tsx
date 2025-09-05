type Props = { d: string; widthPx: number; visible: boolean };
export function VineOverlay({ d, widthPx, visible }: Props) {
  return visible ? (
    <svg className="pointer-events-none fixed inset-0 w-screen h-screen">
      <path d={d} fill="none" stroke="#1B5E20" strokeWidth={widthPx} strokeLinecap="round">
        <animate attributeName="stroke-dasharray" from="0,1000" to="1000,0" dur="0.9s" fill="freeze"/>
      </path>
    </svg>
  ) : null;
}