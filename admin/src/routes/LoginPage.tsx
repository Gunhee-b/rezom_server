import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks';

export function LoginPage() {
  const nav = useNavigate();
  const loc = useLocation() as any;
  const { login } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      // ✅ 앞뒤 공백 제거
      const em = email.trim();
      const pw = password.trim();

      await login(em, pw);
      const to = loc.state?.from?.pathname ?? '/dashboard';
      nav(to, { replace: true });
    } catch (e: any) {
      // ✅ 디버깅용 메시지 보강
      const msg =
        e?.message ||
        e?.body?.error?.message ||
        e?.body?.message ||
        `Login failed${e?.status ? ` (HTTP ${e.status})` : ''}`;
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-neutral-50">
      <form onSubmit={onSubmit} className="w-[min(420px,92vw)] rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-4">Admin Login</h1>

        <label className="block text-sm mb-1">Email</label>
        <input
          className="w-full border rounded px-3 py-2 mb-3"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          type="email"
          inputMode="email"
          autoComplete="username"              // ✅ 자동완성 힌트
          placeholder="admin@rezom.org"
        />

        <label className="block text-sm mb-1">Password</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2 mb-4"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          autoComplete="current-password"      // ✅ 자동완성 힌트
          placeholder="••••••••"
        />

        {err && <p className="text-sm text-red-600 mb-3">{err}</p>}

        <button className="w-full bg-black text-white rounded py-2 disabled:opacity-60" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}