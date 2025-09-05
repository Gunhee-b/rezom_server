import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface RequireAuthProps {
  children?: React.ReactNode
  requiredRole?: string
}

export default function RequireAuth({ children, requiredRole }: RequireAuthProps = {}) {
  const { isAuthed, hasRole, isInitialized } = useAuth()
  
  // Wait for auth to initialize
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }
  
  // Check authentication
  if (!isAuthed) {
    return <Navigate to="/" replace />
  }
  
  // Check authorization if required role is specified
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button 
            onClick={() => window.history.back()} 
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }
  
  return children ? <>{children}</> : <Outlet />
}
