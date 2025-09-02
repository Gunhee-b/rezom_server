import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function RequireAuth() {
  const { isAuthed } = useAuth()
  return isAuthed ? <Outlet /> : <Navigate to="/" replace />
}
