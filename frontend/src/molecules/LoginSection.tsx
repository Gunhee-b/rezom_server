import React, { useState } from 'react'
import { login } from '@/shared/api/auth'
import { Link } from 'react-router-dom'

type Props = {
  open: boolean
  onToggle: () => void
  onSuccess: () => void
  buttonFontPx?: number
  panelScale?: number
  authed?: boolean
  onLogout?: () => void | Promise<void>
}

const LoginSection = React.forwardRef<HTMLButtonElement, Props>(function LoginSection(
  { authed = false, open, onToggle, onSuccess, onLogout, buttonFontPx = 20, panelScale = 1 }: Props,
  ref
) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login({ email, password })
      onSuccess()
    } catch {
      setError('로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleClickLogout = async () => {
    if (!onLogout || logoutLoading) return
    setLogoutLoading(true)
    try {
      await onLogout()
    } finally {
      setLogoutLoading(false)
    }
  }

  return (
    <div className="mx-auto my-12 flex flex-col items-center">
      {authed ? (
        <button
          ref={ref}
          aria-label="logout-button"
          onClick={handleClickLogout}
          disabled={logoutLoading}
          className="rounded-2xl bg-neutral-700 px-6 py-3 text-white shadow-md hover:bg-neutral-800 transition disabled:opacity-60"
          style={{ fontSize: buttonFontPx }}
        >
          {logoutLoading ? '로그아웃 중…' : '로그아웃'}
        </button>
      ) : (
        <button
          ref={ref}
          aria-label="login-button"
          onClick={onToggle}
          className="rounded-2xl bg-emerald-600 px-6 py-3 text-white shadow-md hover:bg-emerald-700 transition"
          style={{ fontSize: buttonFontPx }}
        >
          로그인
        </button>
      )}

      {!authed && open && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 w-[min(420px,92vw)] scale-[var(--panelScale)] rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
          style={{ ['--panelScale' as any]: panelScale }}
        >
          <div className="mb-3">
            <label className="mb-1 block text-sm text-neutral-600">이메일</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-neutral-600">비밀번호</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-60"
              aria-label="confirm-login"
            >
              {loading ? '로그인 중…' : '로그인'}
            </button>

            <button
              type="button"
              onClick={onToggle}
              className="rounded-lg px-4 py-2 text-neutral-600 hover:text-neutral-800"
            >
              취소
            </button>
          </div>

          <div className="mt-4 text-sm space-y-2">
            <div>
              <span className="text-neutral-600">처음이신가요? </span>
              <Link to="/sign-up" className="text-emerald-700 hover:underline">회원가입</Link>
            </div>
            <div>
              <Link to="/forgot-password" className="text-emerald-700 hover:underline">비밀번호를 잊으셨나요?</Link>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  )
})

export default LoginSection
