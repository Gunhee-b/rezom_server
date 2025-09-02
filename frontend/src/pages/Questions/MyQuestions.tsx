import { Link, useSearchParams } from 'react-router-dom'
import { useMyQuestions } from '@/features/questions/hooks'

export default function MyQuestions() {
  const { data = [], isLoading, error } = useMyQuestions()
  const [sp] = useSearchParams()
  const created = sp.get('created') // 방금 작성한 글 id 하이라이트용

  if (isLoading) return <main className="p-6">로딩 중…</main>
  if (error) return <main className="p-6 text-red-600">목록을 가져오지 못했습니다.</main>

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">내가 쓴 글</h1>

      {data.length === 0 ? (
        <p className="text-neutral-600">아직 작성한 글이 없습니다.</p>
      ) : (
        <ul className="divide-y">
          {data.map((q) => {
            const isNew = created === String(q.id)
            return (
              <li
                key={q.id}
                className={`py-3 ${isNew ? 'bg-emerald-50' : ''}`}
              >
                <Link to={`/questions/${q.id}`} className="font-medium hover:underline">
                  {q.title}
                </Link>
                <div className="text-sm text-neutral-500">
                  #{q.id}
                  {q.createdAt ? ` · ${new Date(q.createdAt).toLocaleString()}` : ''}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
