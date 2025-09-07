// src/shared/lib/token.ts
// IMPORTANT: This token manager is synchronized with useAuth hook
// Both use the same 'access_token' localStorage key to prevent conflicts
const KEY = 'access_token'

export const token = {
  get() { 
    // Always read from localStorage to ensure we have the latest token from useAuth
    if (typeof window !== 'undefined') {
      return localStorage.getItem(KEY)
    }
    return null
  },
  set(v: string | null) {
    try {
      if (v) {
        localStorage.setItem(KEY, v)
        // Trigger storage event to sync with useAuth hook
        window.dispatchEvent(new StorageEvent('storage', {
          key: KEY,
          newValue: v,
          oldValue: localStorage.getItem(KEY)
        }))
      } else {
        localStorage.removeItem(KEY)
        // Trigger storage event to sync with useAuth hook
        window.dispatchEvent(new StorageEvent('storage', {
          key: KEY,
          newValue: null,
          oldValue: localStorage.getItem(KEY)
        }))
      }
    } catch (error) {
      console.warn('Failed to set token:', error)
    }
  },
  clear() { this.set(null) },
  
  // Add method to check if token is likely expired (basic check)
  isLikelyExpired() {
    const tokenValue = this.get()
    if (!tokenValue) return true
    
    try {
      // Simple JWT expiry check (can be enhanced)
      const payload = JSON.parse(atob(tokenValue.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)
      return payload.exp && payload.exp < now + 60 // 1 minute buffer
    } catch {
      return false // Can't parse, assume it's valid
    }
  }
}
