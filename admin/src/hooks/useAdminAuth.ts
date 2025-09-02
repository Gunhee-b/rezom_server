import { useContext } from 'react';
import { AdminAuthCtx } from '@/providers/AdminAuthProvider';

export function useAdminAuth() {
  const ctx = useContext(AdminAuthCtx);
  
  // Handle the case where context might be null during initial render
  if (!ctx) {
    return {
      user: null,
      accessToken: null,
      login: async () => {},
      logout: async () => {},
      refresh: async () => {},
      loading: true,
      isAuthed: false,
      authFetchJson: async () => {}
    };
  }
  
  return {
    user: ctx.user,
    accessToken: ctx.accessToken,
    login: ctx.login,
    logout: ctx.logout,
    refresh: ctx.refresh,
    loading: false,
    isAuthed: !!ctx.accessToken,
    authFetchJson: async () => {}
  };
}
