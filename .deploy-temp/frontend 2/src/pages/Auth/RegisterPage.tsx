// src/pages/SignUpPage.tsx
import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

type RegisterResponse = {
  user: { id: number; email: string; displayName: string };
  accessToken: string;
};

// ✅ 브라우저 쿠키에서 값 읽기 (HttpOnly=false 인 CSRF 쿠키만 접근 가능)
function getCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}
const CSRF_HEADER = import.meta.env.VITE_CSRF_HEADER ?? 'X-CSRF-Token';

export default function SignUpPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      // 1) 회원가입
      const res = await api<RegisterResponse>('/auth/register', {
        method: 'POST',
        json: { email, password, displayName },
        withCredentials: true,
      });

      // 2) 액세스 토큰을 메모리/상태에 저장 (데모용)
      sessionStorage.setItem('accessToken', res.accessToken);

      // 3) 웰컴 라우팅 (또는 /me로 프로필 가져오기)
      nav('/', { replace: true });
    } catch (err: any) {
      setError(err.message ?? '회원가입에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function callMe() {
    const token = sessionStorage.getItem('accessToken');
    if (!token) return alert('accessToken이 없습니다.');
    try {
      const me = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }
      ).then((r) => r.json());
      alert(`/auth/me → ${JSON.stringify(me)}`);
    } catch {
      alert('me 호출 실패');
    }
  }

  async function refreshToken() {
    try {
      const csrf = getCookie(CSRF_HEADER) ?? ''; // ✅ 더블서밋
      const refreshed = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { [CSRF_HEADER]: csrf },
        }
      ).then((r) => r.json());
      if (refreshed?.accessToken) {
        sessionStorage.setItem('accessToken', refreshed.accessToken);
        alert('리프레시 성공. 새 accessToken 저장됨.');
      } else {
        alert('리프레시 실패. 다시 로그인 필요.');
      }
    } catch {
      alert('리프레시 호출 실패');
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">회원가입</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">이메일</label>
          <input
            type="email"
            className="w-full rounded border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">닉네임</label>
          <input
            type="text"
            className="w-full rounded border px-3 py-2"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="닉네임"
            required
            minLength={2}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">비밀번호</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8자 이상, 대문자/숫자 포함 권장"
            required
            minLength={8}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded bg-black text-white py-2 disabled:opacity-60"
          disabled={busy}
        >
          {busy ? '가입 중…' : '가입하기'}
        </button>
      </form>

      {/* 데모: 토큰 확인/검증 버튼 */}
      <div className="mt-6 space-y-2">
        <button className="w-full rounded border py-2" onClick={callMe}>
          /auth/me 확인
        </button>

        <button className="w-full rounded border py-2" onClick={refreshToken}>
          /auth/refresh 로 새 토큰 받기
        </button>
      </div>
    </div>
  );
}