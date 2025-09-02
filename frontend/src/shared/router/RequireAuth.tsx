import { Navigate, Outlet } from 'react-router-dom'
import { token } from '@/shared/lib/token'

export default function RequireAuth() {
  const authed = localStorage.getItem('authed') === '1'
  const hasAccess = !!token.get()
  return authed && hasAccess ? <Outlet /> : <Navigate to="/" replace />
}
