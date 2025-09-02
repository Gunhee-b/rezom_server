import { useEffect, useState } from 'react'
import { api } from '@/api/client'

type LoginResp = { user: { id: number; email: string; role?: string }, accessToken: string }

export function useAuth() {
  const [accessToken, setAccessTokenState] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  )
  const [user, setUser] = useState<LoginResp['user'] | null>(null)

  const setAccessToken = (token: string | null) => {
    if (token) localStorage.setItem('accessToken', token)
    else localStorage.removeItem('accessToken')
    setAccessTokenState(token)
  }

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'accessToken') setAccessTokenState(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  async function login(email: string, password: string) {
    const res = await api<LoginResp>('/auth/login', {
      method: 'POST',
      json: { email, password },
      withCredentials: true,
    })
    setAccessToken(res.accessToken)
    setUser(res.user)
  }

  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }) } finally {
      setAccessToken(null)
      setUser(null)
    }
  }

  async function refresh() {
    const res = await api<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      withCredentials: true,
      withCsrf: true,
    })
    if (res?.accessToken) setAccessToken(res.accessToken)
  }

  return { accessToken, user, setAccessToken, login, logout, refresh, isAuthed: !!accessToken }
}