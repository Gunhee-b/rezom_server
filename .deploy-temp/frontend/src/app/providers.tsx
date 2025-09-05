// src/app/providers.tsx (혹은 당신 위치 그대로)
import React, { useEffect, useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { api } from '@/shared/lib/axios'  // axios 인스턴스
import { token } from '@/shared/lib/token'

const client = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

function readCookie(name: string) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : undefined
}

export function Providers({ children }: { children: React.ReactNode }) {
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true

    // ✅ axios 인스턴스 전역 기본값(중복 세팅해도 무해)
    api.defaults.withCredentials = true
    api.defaults.xsrfCookieName = 'X-CSRF-Token'
    api.defaults.xsrfHeaderName = 'X-CSRF-Token'

    const hasAccess = !!token.get()
    const authed = localStorage.getItem('authed') === '1'

    // ✅ refresh 시도 전 '세션 쿠키 + CSRF 쿠키'가 실제로 있는지 확인
    const hasRt = !!readCookie('rezom_rt')
    const csrf = readCookie('X-CSRF-Token')

    // 조건: (1) 사용자가 로컬 상태상 로그인으로 표시 && (2) 실제 쿠키 2종이 존재
    if (!authed || !hasRt || !csrf) return

    // 🚫 axios 인터셉터가 재귀 refresh를 하지 않도록 플래그 넘김 (_noRefresh는 당신 코드 호환 유지)
    api
      .post(
        '/auth/refresh',
        {},
        {
          headers: { 'X-CSRF-Token': csrf }, // 안전빵으로 직접 헤더도 명시
          withCredentials: true,
          _noRefresh: true,
        }
      )
      .then((res) => {
        const at = res?.data?.accessToken
        if (at) token.set(at)
      })
      .catch(() => {
        // 401 등 초기 미로그인 케이스는 조용히 무시
      })
  }, [])

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}