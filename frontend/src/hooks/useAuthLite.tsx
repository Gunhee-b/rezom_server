// src/hooks/useAuth.ts
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';

type User = { id: number; email: string; displayName?: string };
type AuthResp = { user: User; accessToken: string };

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  register(email: string, password: string, displayName: string): Promise<void>;
  login(email: string, password: string): Promise<void>;
  refresh(): Promise<void>;
  logout(): Promise<void>;
  authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
};

const AuthContext = createContext<AuthContextType>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => sessionStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);

  const saveToken = useCallback((t: string | null) => {
    setAccessToken(t);
    if (t) sessionStorage.setItem('accessToken', t);
    else sessionStorage.removeItem('accessToken');
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const res = await api<AuthResp>('/auth/register', {
      method: 'POST',
      json: { email, password, displayName },
    });
    saveToken(res.accessToken);
    setUser(res.user);
  }, [saveToken]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<AuthResp>('/auth/login', {
      method: 'POST',
      json: { email, password },
    });
    saveToken(res.accessToken);
    setUser(res.user);
  }, [saveToken]);

  const refresh = useCallback(async () => {
    // 서버는 CSRF 더블서밋 요구 → 헤더에 CSRF 쿠키값을 넣어 호출
    const res = await api<AuthResp>('/auth/refresh', { method: 'POST', withCsrf: true });
    if (res?.accessToken) {
      saveToken(res.accessToken);
      // 일부 구현은 user를 안 보낼 수 있음 → /auth/me로 동기화하거나 기존 유지
      if (res.user) setUser(res.user);
    } else {
      throw new Error('Unable to refresh');
    }
  }, [saveToken]);

  const logout = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST' }); } finally {
      saveToken(null);
      setUser(null);
    }
  }, [saveToken]);

  useEffect(() => {
    (async () => {
      if (!accessToken) { setLoading(false); return; }
      try {
        const meRes = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'https://api.rezom.org'}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        });
        if (meRes.ok) {
          const me = await meRes.json();
          setUser(me?.user ?? me);
        } else if (meRes.status === 401) {
          await refresh();
        }
      } catch {}
      setLoading(false);
    })();
  }, [accessToken, refresh]);

  const authFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    const doFetch = (token?: string | null) =>
      fetch(input, {
        ...(init ?? {}),
        credentials: 'include',
        headers: {
          ...(init?.headers ?? {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

    let res = await doFetch(accessToken);
    if (res.status === 401) {
      try {
        await refresh();
        res = await doFetch(sessionStorage.getItem('accessToken'));
      } catch {
        // refresh 실패 그대로
      }
    }
    return res;
  }, [accessToken, refresh]);

  const value = useMemo(() => ({
    user, accessToken, loading,
    register, login, refresh, logout, authFetch,
  }), [user, accessToken, loading, register, login, refresh, logout, authFetch]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}