type ApiOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    json?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    withCredentials?: boolean;
    withCsrf?: boolean;
    accessToken?: string;
  };
  
  const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.rezom.org';
  
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
  
    const url = `${API_BASE}${path}${buildQuery(query)}`;
  
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (json !== undefined) headers['Content-Type'] = 'application/json';
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    if (withCsrf) {
      const csrf = readCookie('X-CSRF-Token'); // 서버 쿠키명과 동일
      if (csrf) {
        headers['X-CSRF-Token'] = csrf;
      } else {
        console.warn('⚠️ CSRF requested but no token found in cookies');
      }
    }
  
    const res = await fetch(url, {
      method,
      headers,
      body: json !== undefined ? JSON.stringify(json) : undefined,
      credentials: withCredentials !== false ? 'include' : 'same-origin', // Default to include cookies
    });
  
    if (res.status === 204) return undefined as unknown as T;
  
    const ct = res.headers.get('content-type') || '';
    const isJson = ct.includes('application/json');
    const body = isJson ? await res.json().catch(() => ({})) : await res.text();
  
    if (!res.ok) {
      const msg = (isJson && (body?.error?.message || body?.message)) || `HTTP ${res.status}`;
      const err = new Error(msg) as any;
      err.status = res.status;
      err.body = body;
      throw err;
    }
  
    return body as T;
  }