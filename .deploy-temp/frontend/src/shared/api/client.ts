// src/shared/api/client.ts

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  json?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  withCredentials?: boolean;  // 쿠키 전송
  withCsrf?: boolean;         // X-CSRF-Token 자동 부착 (쿠키에서 읽음)
  accessToken?: string;       // Authorization: Bearer ...
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

function buildQuery(q?: ApiOptions['query']) {
  if (!q) return '';
  const usp = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== null) usp.set(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

function readCookie(name: string) {
  if (typeof document === 'undefined') return undefined;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

export async function api<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const {
    method = 'GET',
    json,
    query,
    withCredentials,
    withCsrf,
    accessToken,
  } = opts;

  const url = `${API_BASE_URL}${path}${buildQuery(query)}`;

  const headers: Record<string, string> = { Accept: 'application/json' };

  if (json !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  if (withCsrf) {
    // 서버에서 내려주는 쿠키명(default: X-CSRF-Token)
    const csrf = readCookie('X-CSRF-Token');
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: json !== undefined ? JSON.stringify(json) : undefined,
    credentials: withCredentials ? 'include' : 'same-origin',
  });

  if (res.status === 204) return undefined as unknown as T;

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const message =
      (isJson && (body?.error?.message || body?.message)) ||
      `HTTP ${res.status}`;
    const err = new Error(message) as any;
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body as T;
}