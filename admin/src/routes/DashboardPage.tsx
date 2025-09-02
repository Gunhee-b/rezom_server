import { useState } from 'react';
import { useAdminAuth } from '@/hooks';
import { api } from '@/api/client';

type Suggestion = {
  id: number;
  conceptId: number;
  keywords: string[];
  suggestion: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
};

export function DashboardPage() {
  const { accessToken, refresh, logout } = useAdminAuth();
  const [slug, setSlug] = useState('language-definition');
  const [items, setItems] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setBusy(true); setMsg(null);
    try {
      const list = await api<Suggestion[]>(`/define/concepts/${slug}/suggestions`, { withCredentials: true });
      setItems(list);
    } catch (e: any) {
      setMsg(e?.message ?? 'Load failed');
    } finally { setBusy(false); }
  };

  const approve = async (id: number) => {
    setBusy(true); setMsg(null);
    try {
      await api(`/define/concepts/${slug}/approve`, {
        method: 'POST',
        json: { suggestionId: id },
        withCredentials: true,
        withCsrf: true,
        accessToken: accessToken ?? undefined,
      });
      setMsg('Approved ✅'); await load();
    } catch (e: any) {
      if (e?.status === 401) {
        try {
          await refresh();
          await approve(id);
          return;
        } catch {}
      }
      setMsg(e?.message ?? 'Approve failed');
    } finally { setBusy(false); }
  };

  return (
    <main className="p-6">
      <header className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <div className="ml-auto flex gap-2">
          <a href="/questions" className="border rounded px-3 py-1 hover:bg-gray-100">Questions & Keywords</a>
          <button className="border rounded px-3 py-1" onClick={load} disabled={busy}>Reload</button>
          <button className="border rounded px-3 py-1" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="mb-4 flex gap-2">
        <input className="border rounded px-3 py-2" value={slug} onChange={(e)=>setSlug(e.target.value)} />
        <button className="bg-black text-white rounded px-4" onClick={load} disabled={busy}>Load suggestions</button>
      </div>

      {msg && <p className="mb-3 text-sm">{msg}</p>}
      <ul className="space-y-3">
        {items.map((s) => (
          <li key={s.id} className="border rounded p-3">
            <div className="text-sm text-neutral-600">{s.keywords.join(', ')}</div>
            <div className="font-medium">{s.suggestion}</div>
            <div className="text-xs text-neutral-500 mt-1">status: {s.status}</div>
            <button className="mt-2 border rounded px-3 py-1" onClick={()=>approve(s.id)} disabled={busy}>
              Approve
            </button>
          </li>
        ))}
        {items.length === 0 && !busy && <li className="text-neutral-500">No suggestions</li>}
      </ul>
    </main>
  );
}