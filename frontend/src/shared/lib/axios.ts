import axios, { AxiosHeaders } from 'axios'
import { token } from './token'

export const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3000',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const at = token.get()
  const h = new AxiosHeaders(config.headers || {})
  
  // Add Authorization header if token exists
  if (at) {
    h.set('Authorization', `Bearer ${at}`)
  }
  
  // Add CSRF token for protected endpoints (POST, PUT, DELETE methods)
  if (['post', 'put', 'delete'].includes(config.method?.toLowerCase() || '')) {
    const getCsrfToken = () => {
      const match = document.cookie.match(/(?:^|; )X-CSRF-Token=([^;]*)/)
      return match ? decodeURIComponent(match[1]) : null
    }
    
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      h.set('X-CSRF-Token', csrfToken)
    }
  }
  
  config.headers = h
  return config
})

// Global refresh state to coordinate with useAuth hook
let isRefreshing = false
let waiters: Array<() => void> = []

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const { config, response } = error
    const url = (config?.url || '').toString()

    // Skip refresh for certain endpoints or explicit flags
    const skipRefresh =
      (config as any)?._noRefresh ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout') ||
      url.includes('/auth/me') // Let useAuth handle /auth/me failures

    const hasAccess = !!token.get()

    if (!response || response.status !== 401 || skipRefresh || (config as any)?._retry || !hasAccess) {
      return Promise.reject(error)
    }

    ;(config as any)._retry = true

    if (isRefreshing) {
      // Wait for ongoing refresh to complete
      await new Promise<void>((resolve) => waiters.push(resolve))
    } else {
      isRefreshing = true
      try {
        // Check if token was updated by useAuth hook during this time
        const currentToken = token.get()
        if (!currentToken) {
          // Token hasn't been refreshed by useAuth, do it here
          const getCsrfToken = () => {
            const match = document.cookie.match(/(?:^|; )X-CSRF-Token=([^;]*)/)
            return match ? decodeURIComponent(match[1]) : null
          }
          
          const csrfToken = getCsrfToken()
          const refreshConfig: any = { 
            _noRefresh: true,
            withCredentials: true
          }
          
          if (csrfToken) {
            refreshConfig.headers = { 'X-CSRF-Token': csrfToken }
          }
          
          const { data } = await api.post('/auth/refresh', {}, refreshConfig)
          if (data?.accessToken) {
            token.set(data.accessToken)
          } else {
            throw new Error('No access token in refresh response')
          }
        }
        // If token was already refreshed by useAuth, just continue
      } catch (refreshError: any) {
        // Refresh failed: clear session
        console.warn('[Axios] Token refresh failed:', refreshError?.response?.data || refreshError.message)
        token.clear()
        
        // Notify other parts of the app about auth failure
        window.dispatchEvent(new CustomEvent('auth:refresh-failed'))
        
        isRefreshing = false
        waiters.forEach((fn) => fn())
        waiters = []
        return Promise.reject(error)
      }
      isRefreshing = false
      waiters.forEach((fn) => fn())
      waiters = []
    }

    // Check if we have a valid token after refresh
    const finalToken = token.get()
    if (!finalToken) {
      return Promise.reject(error)
    }

    // Retry the original request with the new token
    return api(config)
  }
)
