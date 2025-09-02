import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getQuestion, type Question } from '@/shared/api/questions'

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>()
  const qid = Number(id)

  const { data, isLoading, error } = useQuery<Question>({
    queryKey: ['question', qid],
    queryFn: () => getQuestion(qid),
    enabled: Number.isFinite(qid) && qid > 0,
  })

  if (!qid) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-red-600">잘못된 접근입니다.</p>
        <Link to="/users/me/questions" className="mt-3 inline-block text-emerald-700 underline">
          목록으로
        </Link>
      </div>
    )
  }

  if (isLoading) return <div className="p-6">불러오는 중…</div>
  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-red-600">글을 불러오지 못했습니다.</p>
        <Link to="/users/me/questions" className="mt-3 inline-block text-emerald-700 underline">
          목록으로
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4">
        <Link to="/users/me/questions" className="text-sm text-emerald-700 underline">
          ← 내 글 목록으로
        </Link>
      </div>

      <h1 className="mb-2 text-2xl font-semibold">{data?.title}</h1>
      <p className="whitespace-pre-wrap text-neutral-800">{data?.body}</p>

      {/* 필요하면 여기 아래에 답변/댓글 섹션을 점진적으로 붙이면 됩니다 */}
    </div>
  )
}
