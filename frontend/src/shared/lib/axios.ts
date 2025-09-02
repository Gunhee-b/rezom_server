import axios, { AxiosHeaders } from 'axios'
import { token } from './token'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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

let isRefreshing = false
let waiters: Array<() => void> = []

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const { config, response } = error
    const url = (config?.url || '').toString()

    // refresh/logout 또는 명시적 플래그는 재시도 금지
    const skipRefresh =
      (config as any)?._noRefresh ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout')

    const hasAccess = !!token.get()

    if (!response || response.status !== 401 || skipRefresh || (config as any)?._retry || !hasAccess) {
      return Promise.reject(error)
    }

    ;(config as any)._retry = true

    if (isRefreshing) {
      await new Promise<void>((res) => waiters.push(res))
    } else {
      isRefreshing = true
      try {
        // Get CSRF token from cookie for refresh request
        const getCsrfToken = () => {
          const match = document.cookie.match(/(?:^|; )X-CSRF-Token=([^;]*)/)
          return match ? decodeURIComponent(match[1]) : null
        }
        
        const csrfToken = getCsrfToken()
        const refreshConfig: any = { 
          _noRefresh: true,
          withCredentials: true
        }
        
        // Add CSRF token if available
        if (csrfToken) {
          refreshConfig.headers = { 'X-CSRF-Token': csrfToken }
        }
        
        const { data } = await api.post('/auth/refresh', {}, refreshConfig)
        if (data?.accessToken) token.set(data.accessToken)
      } catch (refreshError: any) {
        // ✅ refresh 실패: 세션 정리 → 이후 요청은 401로 떨어지고 UI는 로그인 유도
        console.warn('Token refresh failed:', refreshError?.response?.data || refreshError.message)
        token.clear()
        localStorage.removeItem('authed')
        isRefreshing = false
        waiters.forEach((fn) => fn())
        waiters = []
        return Promise.reject(error)
      }
      isRefreshing = false
      waiters.forEach((fn) => fn())
      waiters = []
    }

    return api(config)
  }
)
