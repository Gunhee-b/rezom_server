// src/hooks/useAuth.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/shared/api/client';

type User = { id: number; email: string; displayName?: string; role?: string };
type AuthResp = { user?: User; accessToken?: string };

export function useAuth() {
  const [accessToken, setAccessTokenState] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  );
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(() => {
    // If there's no token, we're immediately initialized
    // If there's a token, we need to verify it first
    return typeof window !== 'undefined' ? !localStorage.getItem('access_token') : true;
  });
  const isAuthed = !!accessToken;

  const setAccessToken = useCallback((token: string | null) => {
    if (token) localStorage.setItem('access_token', token);
    else localStorage.removeItem('access_token');
    setAccessTokenState(token);
  }, []);

  // storage 동기화 및 auth failure 이벤트 리스닝
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'access_token') setAccessTokenState(e.newValue);
    };
    
    const onAuthFailure = () => {
      console.warn('[useAuth] Received auth failure event from axios client');
      setAccessToken(null);
      setUser(null);
    };
    
    window.addEventListener('storage', onStorage);
    window.addEventListener('auth:refresh-failed', onAuthFailure);
    
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth:refresh-failed', onAuthFailure);
    };
  }, [setAccessToken]);

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
    console.log('[useAuth] Starting login for:', email);
    try {
      const res = await api<AuthResp>('/auth/login', {
        method: 'POST',
        json: { email, password },
        withCredentials: true,    // ★ 쿠키 수신
      });
      console.log('[useAuth] Login response received:', !!res.accessToken, !!res.user);
      if (res.accessToken) {
        console.log('[useAuth] Setting access token from login');
        setAccessToken(res.accessToken);
        // Set initialized after token is set to avoid race condition
        setIsInitialized(true);
      }
      if (res.user) {
        console.log('[useAuth] Setting user from login:', res.user.email);
        setUser(res.user);
      }
    } catch (error) {
      console.error('[useAuth] Login error:', error);
      throw error; // Re-throw to let the UI handle it
    }
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
      await api('/auth/logout', { 
        method: 'POST', 
        withCredentials: true,
        accessToken 
      });
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, [setAccessToken, accessToken]);

  // 부팅 시 토큰 있으면 /auth/me 동기화 (토큰 만료면 refresh)
  useEffect(() => {
    (async () => {
      console.log('[useAuth] Initializing auth state, accessToken:', !!accessToken);
      if (!accessToken) {
        console.log('[useAuth] No access token, setting initialized to true');
        setIsInitialized(true);
        return;
      }
      try {
        console.log('[useAuth] Validating existing token...');
        const baseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000');
        const me = await fetch(`${baseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        });
        if (me.ok) {
          const data = await me.json();
          console.log('[useAuth] Token valid, setting user:', data?.user?.email);
          setUser(data?.user ?? data);
        } else if (me.status === 401) {
          console.log('[useAuth] Token expired (401), attempting refresh...');
          // Token expired, try to refresh
          try {
            const res = await api<AuthResp>('/auth/refresh', {
              method: 'POST',
              withCredentials: true,
              withCsrf: true,
            });
            if (res?.accessToken) {
              console.log('[useAuth] Refresh successful, updating token');
              setAccessToken(res.accessToken);
              if (res.user) setUser(res.user);
            } else {
              console.log('[useAuth] Refresh failed - no token received, clearing auth');
              // Refresh failed, clear tokens
              setAccessToken(null);
              setUser(null);
            }
          } catch (refreshError) {
            console.log('[useAuth] Refresh failed with error, clearing auth:', refreshError);
            // Refresh failed, clear tokens
            setAccessToken(null);
            setUser(null);
          }
        } else {
          console.log('[useAuth] Token validation failed with status:', me.status);
        }
      } catch (error) { 
        console.log('[useAuth] Network error during token validation:', error);
        /* 네트워크 실패 무시 */ 
      }
      finally {
        console.log('[useAuth] Setting initialized to true');
        setIsInitialized(true);
      }
    })();
  }, [accessToken, setAccessToken]);

  // Add role-based helper functions
  const hasRole = useCallback((requiredRole: string) => {
    return user?.role === requiredRole;
  }, [user]);

  const isAdmin = useMemo(() => hasRole('ADMIN'), [hasRole]);

  // Add method to get valid token (for external API clients)
  const getValidToken = useCallback(async () => {
    if (!accessToken) return null;
    
    // Check if we need to refresh (simple approach - could be enhanced with JWT parsing)
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const testResponse = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      });
      
      if (testResponse.ok) {
        return accessToken;
      } else if (testResponse.status === 401) {
        // Token expired, try refresh
        await refresh();
        return localStorage.getItem('access_token');
      }
    } catch (error) {
      console.warn('Token validation failed:', error);
    }
    
    return accessToken;
  }, [accessToken, refresh]);

  const value = useMemo(() => ({
    accessToken,
    setAccessToken,
    isAuthed,
    user,
    isInitialized,
    register,
    login,
    refresh,
    logout,
    hasRole,
    isAdmin,
    getValidToken,
  }), [accessToken, setAccessToken, isAuthed, user, isInitialized, register, login, refresh, logout, hasRole, isAdmin, getValidToken]);

  return value;
}