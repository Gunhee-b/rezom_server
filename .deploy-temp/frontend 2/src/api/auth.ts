// src/lib/api.ts
import { CSRF_HEADER, getCookie } from '@/utils/cookies';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

type Json = Record<string, unknown>;

export async function api<T = any>(
  path: string,
  opts: RequestInit & { json?: Json; withCsrf?: boolean } = {}
): Promise<T> {
  const { json, headers, withCsrf, ...rest } = opts;

  const csrfHeader = withCsrf
    ? { [CSRF_HEADER]: getCookie(CSRF_HEADER) ?? '' }
    : {};

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? 'GET',
    credentials: 'include', // ← HttpOnly refresh 쿠키 전송
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeader,
      ...(headers ?? {}),
    },
    body: json ? JSON.stringify(json) : opts.body,
    ...rest,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.message || data?.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  try { return (await res.json()) as T; } catch { return undefined as T; }
}