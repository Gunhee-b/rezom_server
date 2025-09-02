// src/lib/api.ts (또는 저장된 경로)
/* 타입에 credentials와 withCredentials(별칭) 모두 허용 */
type ApiOptions<TBody = unknown> = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  json?: TBody;
  withCsrf?: boolean;     // X-CSRF-Token 헤더 자동 부착
  accessToken?: string;   // Authorization: Bearer ...
  credentials?: RequestCredentials; // 'include' | 'same-origin' | 'omit'
  withCredentials?: boolean;        // axios 스타일 별칭 (true면 include 처리)
};

export async function api<TResp = unknown, TBody = unknown>(
  path: string,
  options: ApiOptions<TBody> = {}
): Promise<TResp> {
  const base = import.meta.env.VITE_API_BASE_URL ?? 'https://api.rezom.org';

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Authorization
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  // CSRF (더블서밋용 쿠키에서 읽어 헤더로 전달)
  if (options.withCsrf) {
    const m = document.cookie.match(/(?:^|;\s*)X-CSRF-Token=([^;]+)/);
    if (m) headers['X-CSRF-Token'] = decodeURIComponent(m[1]);
  }

  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers,
    body: options.json ? JSON.stringify(options.json) : undefined,
    // 🔸 기본적으로 쿠키 포함
    credentials:
      options.withCredentials ? 'include'
      : options.credentials ?? 'include',
  };

  const res = await fetch(`${base}${path}`, init);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error?.message ?? j?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<TResp>;
}