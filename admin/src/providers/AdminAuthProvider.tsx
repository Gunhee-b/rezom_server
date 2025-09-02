import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';

type User = { id: number; email: string; displayName?: string; role?: string };
type AuthResp = { user: User; accessToken: string };

type Ctx = {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

export const AdminAuthCtx = createContext<Ctx>(null as any);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAT] = useState<string | null>(() => localStorage.getItem('admin.at'));

  const saveAT = useCallback((t: string | null) => {
    setAT(t);
    if (t) localStorage.setItem('admin.at', t);
    else localStorage.removeItem('admin.at');
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<AuthResp>('/auth/login', {
      method: 'POST',
      json: { email, password },
      withCredentials: true,
    });
    saveAT(res.accessToken);
    setUser(res.user);
  }, [saveAT]);

  const refresh = useCallback(async () => {
    const res = await api<AuthResp>('/auth/refresh', {
      method: 'POST',
      withCredentials: true,
      withCsrf: true,
    });
    if (res?.accessToken) {
      saveAT(res.accessToken);
      if (res.user) setUser(res.user);
    } else {
      throw new Error('refresh failed');
    }
  }, [saveAT]);

  const logout = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST', withCredentials: true }); }
    finally { saveAT(null); setUser(null); }
  }, [saveAT]);

  // 부팅 시 /auth/me (있으면 세션 동기화)
  useEffect(() => {
    (async () => {
      if (!accessToken) return;
      try {
        const me = await api<{ id: number; email: string; role?: string }>('/auth/me', {
          withCredentials: true,
          accessToken,
        });
        setUser({ id: me.id, email: me.email, role: me.role });
      } catch {
        // 실패 시 조용히
      }
    })();
  }, [accessToken]);

  const value = useMemo<Ctx>(() => ({ user, accessToken, login, refresh, logout }), [user, accessToken, login, refresh, logout]);

  return <AdminAuthCtx.Provider value={value}>{children}</AdminAuthCtx.Provider>;
}