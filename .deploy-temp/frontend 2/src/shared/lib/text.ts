// 단어 기준 줄바꿈. rx: ellipse 반경(px), fontPx: 글자 크기(px)
export function wrapLabelToEllipse(
    text: string,
    rx: number,
    fontPx: number,
    opts?: { paddingRatio?: number; avgCharRatio?: number; maxLines?: number }
  ): string[] {
    const paddingRatio = opts?.paddingRatio ?? 0.9;     // 좌우 여유
    const avgCharRatio = opts?.avgCharRatio ?? 0.58;    // 글자 평균폭 ~ 0.56~0.6
    const maxLines     = opts?.maxLines ?? 4;
  
    const usableWidth = rx * 2 * paddingRatio;          // 타원 가로폭 * 패딩
    const charsPerLine = Math.max(4, Math.floor(usableWidth / (fontPx * avgCharRatio)));
  
    // 이미 개행이 있으면 그것부터 유지
    const chunks = text.split(/\n+/).flatMap((block) => {
      const words = block.split(/\s+/);
      const lines: string[] = [];
      let line = '';
  
      for (const w of words) {
        const next = line ? `${line} ${w}` : w;
        if (next.length > charsPerLine) {
          if (line) lines.push(line);
          // 너무 긴 단어는 강제로 쪼개기
          if (w.length > charsPerLine) {
            for (let i = 0; i < w.length; i += charsPerLine) {
              lines.push(w.slice(i, i + charsPerLine));
            }
            line = '';
          } else {
            line = w;
          }
        } else {
          line = next;
        }
      }
      if (line) lines.push(line);
      return lines;
    });
  
    if (chunks.length <= maxLines) return chunks;
  
    const clipped = chunks.slice(0, maxLines);
    const last = clipped[maxLines - 1];
    // 말줄임 (여유 2글자 정도 확보)
    clipped[maxLines - 1] = last.length > 2 ? last.slice(0, Math.max(0, last.length - 2)) + '…' : '…';
    return clipped;
  }