import { useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/api/client'

type UserQuestion = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
};

type UserAnswer = {
  id: number;
  title?: string;
  body: string;
  questionId: number;
  createdAt: string;
  Question: {
    id: number;
    title: string;
  };
};

function useMyQuestions() {
  const { accessToken } = useAuth();
  return useQuery<UserQuestion[]>({
    queryKey: ['my-questions'],
    queryFn: () => api<UserQuestion[]>('/users/me/questions', { accessToken }),
    enabled: !!accessToken,
  });
}

function useMyAnswers() {
  const { accessToken } = useAuth();
  return useQuery<UserAnswer[]>({
    queryKey: ['my-answers'],
    queryFn: () => api<UserAnswer[]>('/users/me/answers', { accessToken }),
    enabled: !!accessToken,
  });
}

export default function MyQuestionsPage() {
  const [sp] = useSearchParams()
  const created = sp.get('created')
  const { data: questions, isLoading: questionsLoading, error: questionsError, refetch: refetchQuestions } = useMyQuestions()
  const { data: answers, isLoading: answersLoading, error: answersError, refetch: refetchAnswers } = useMyAnswers()

  useEffect(() => { 
    if (created) {
      refetchQuestions()
      refetchAnswers()
    }
  }, [created, refetchQuestions, refetchAnswers])

  const isLoading = questionsLoading || answersLoading
  const hasError = questionsError || answersError

  if (isLoading) return <div className="p-6">불러오는 중…</div>
  if (hasError) return <div className="p-6 text-red-600">목록을 가져오지 못했습니다.</div>

  const hasContent = (questions && questions.length > 0) || (answers && answers.length > 0)

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">내가 쓴 글</h1>
        <Link
          to="/"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 transition-colors"
        >
          홈으로
        </Link>
      </div>

      {!hasContent && (
        <p className="text-neutral-500">아직 작성한 글이 없습니다.</p>
      )}

      {/* Questions Section */}
      {questions && questions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">내가 만든 질문</h2>
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{question.title}</h3>
                <p className="text-gray-700 mb-3 line-clamp-3">{question.body}</p>
                <div className="text-sm text-gray-500">
                  {new Date(question.createdAt).toLocaleString('ko-KR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answers Section */}
      {answers && answers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">내가 쓴 답변</h2>
          <div className="space-y-4">
            {answers.map((answer) => (
              <div key={answer.id} className="bg-white border border-gray-200 rounded-lg p-4">
                {answer.title && (
                  <h3 className="font-semibold text-gray-900 mb-2">{answer.title}</h3>
                )}
                <p className="text-gray-700 mb-3 line-clamp-3">{answer.body}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>질문: {answer.Question.title}</span>
                  <span>{new Date(answer.createdAt).toLocaleString('ko-KR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
