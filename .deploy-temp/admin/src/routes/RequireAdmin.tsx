import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks';

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAdminAuth();
  const loc = useLocation();

  // 최소: 토큰만 있으면 통과. (정밀하게 하려면 user.role === 'ADMIN' 확인)
  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  return <>{children}</>;
}