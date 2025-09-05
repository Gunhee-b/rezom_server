// src/utils/cookies.ts
export function getCookie(name: string): string | null {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : null;
  }
  
  // 프로젝트에서 쓰는 CSRF 헤더명/쿠키명 (서버와 동일해야 함)
  export const CSRF_HEADER = import.meta.env.VITE_CSRF_HEADER ?? 'X-CSRF-Token';
  export const RT_COOKIE  = import.meta.env.VITE_RT_COOKIE ?? 'rezom_rt';