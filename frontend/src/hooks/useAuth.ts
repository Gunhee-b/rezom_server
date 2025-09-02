// src/hooks/useAuth.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';

type User = { id: number; email: string; displayName?: string };
type AuthResp = { user?: User; accessToken?: string };

export function useAuth() {
  const [accessToken, setAccessTokenState] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  );
  const [user, setUser] = useState<User | null>(null);
  const isAuthed = !!accessToken;

  // storage 동기화
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'access_token') setAccessTokenState(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setAccessToken = useCallback((token: string | null) => {
    if (token) localStorage.setItem('access_token', token);
    else localStorage.removeItem('access_token');
    setAccessTokenState(token);
  }, []);

  // ----- 여기가 새로 추가되는 메서드들 -----

  // 회원가입
  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const res = await api<AuthResp>('/auth/register', {
      method: 'POST',
      json: { email, password, displayName },
      withCredentials: true,    // ★ 쿠키 수신(리프레시/CSRF)
    });
    if (res.accessToken) setAccessToken(res.accessToken);
    if (res.user) setUser(res.user);
  }, [setAccessToken]);

  // 로그인
  const login = useCallback(async (email: string, password: string) => {
    const res = await api<AuthResp>('/auth/login', {
      method: 'POST',
      json: { email, password },
      withCredentials: true,    // ★ 쿠키 수신
    });
    if (res.accessToken) setAccessToken(res.accessToken);
    if (res.user) setUser(res.user);
  }, [setAccessToken]);

  // 리프레시 (CSRF 더블서밋)
  const refresh = useCallback(async () => {
    const res = await api<AuthResp>('/auth/refresh', {
      method: 'POST',
      withCredentials: true,    // ★ 쿠키 전송
      withCsrf: true,           // ★ 헤더에 X-CSRF-Token 자동 부착
    });
    if (!res?.accessToken) throw new Error('Unable to refresh');
    setAccessToken(res.accessToken);
    if (res.user) setUser(res.user);
  }, [setAccessToken]);

  // 로그아웃
  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST', withCredentials: true });
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, [setAccessToken]);

  // 부팅 시 토큰 있으면 /auth/me 동기화 (토큰 만료면 refresh)
  useEffect(() => {
    (async () => {
      if (!accessToken) return;
      try {
        const me = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        });
        if (me.ok) {
          const data = await me.json();
          setUser(data?.user ?? data);
        } else if (me.status === 401) {
          await refresh();
        }
      } catch { /* 네트워크 실패 무시 */ }
    })();
  }, [accessToken, refresh]);

  const value = useMemo(() => ({
    accessToken,
    setAccessToken,
    isAuthed,
    user,
    register,
    login,
    refresh,
    logout,
  }), [accessToken, setAccessToken, isAuthed, user, register, login, refresh, logout]);

  return value;
}