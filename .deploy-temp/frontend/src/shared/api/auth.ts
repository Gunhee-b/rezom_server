import { api } from '@/shared/lib/axios'
import { token } from '@/shared/lib/token'

export type LoginDto = { email: string; password: string }

export async function login(dto: LoginDto) {
  const { data, headers } = await api.post('/auth/login', dto)

  const bodyToken =
    data?.accessToken ?? data?.access_token ?? data?.token ?? data?.data?.accessToken
  const headerToken =
    headers?.authorization?.startsWith('Bearer ')
      ? headers.authorization.slice('Bearer '.length)
      : undefined
  const at = bodyToken ?? headerToken
  if (at) token.set(at)
  localStorage.setItem('authed', '1')
  return data
}

export async function me() {
  const { data } = await api.get('/auth/me')
  return data
}

// ✅ 로그아웃은 UI를 먼저 바꾸고, 네트워크는 재시도 없이 짧게 시도
export async function logout() {
  token.clear()
  localStorage.removeItem('authed')
  try {
    await api.post(
      '/auth/logout',
      {},
      {
        timeout: 4000,
        _noRefresh: true,
      }
    )
  } catch {
    // 실패해도 무시 (이미 클라이언트 상태는 로그아웃)
  }
}
