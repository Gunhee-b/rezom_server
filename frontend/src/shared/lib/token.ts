// src/shared/lib/token.ts
const KEY = 'access_token'

export const token = {
  get() { 
    // Always read from localStorage to ensure we have the latest token
    if (typeof window !== 'undefined') {
      return localStorage.getItem(KEY)
    }
    return null
  },
  set(v: string | null) {
    try {
      if (v) {
        localStorage.setItem(KEY, v)
        // Also set accessToken format for compatibility with useAuth hook
        localStorage.setItem('accessToken', v)
        localStorage.setItem('authed', 'true')
      } else {
        localStorage.removeItem(KEY)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('authed')
      }
    } catch {}
  },
  clear() { this.set(null) },
}
