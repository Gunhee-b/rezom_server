import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { listMyQuestions, listMyAnswers, listMySocialAnalysisAnswers, updateQuestion, deleteQuestion } from '@/shared/api/questions'
import { getMyInsightsViaUsers, updateInsight, deleteInsight, type Insight } from '@/api/insights'
import { EditQuestionModal } from './components/EditQuestionModal'
import { DeleteConfirmModal } from './components/DeleteConfirmModal'

type UserQuestion = {
  id: number;
  title: string;
  body: string;
  tags?: string[];
  createdAt?: string;
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

type TabType = 'social-analysis' | 'answers' | 'insights';

function useMyQuestions() {
  const { isAuthed } = useAuth();
  return useQuery<UserQuestion[]>({
    queryKey: ['my-questions'],
    queryFn: listMyQuestions,
    enabled: isAuthed,
  });
}

function useMyAnswers() {
  const { isAuthed } = useAuth();
  return useQuery<UserAnswer[]>({
    queryKey: ['my-answers'],
    queryFn: listMyAnswers,
    enabled: isAuthed,
  });
}

function useMySocialAnalysisAnswers() {
  const { isAuthed } = useAuth();
  return useQuery<UserAnswer[]>({
    queryKey: ['my-social-analysis-answers'],
    queryFn: listMySocialAnalysisAnswers,
    enabled: isAuthed,
  });
}

function useMyInsights() {
  const { isAuthed, accessToken } = useAuth();
  return useQuery<Insight[]>({
    queryKey: ['my-insights'],
    queryFn: () => getMyInsightsViaUsers(accessToken || undefined),
    enabled: isAuthed,
  });
}


export default function MyQuestionsPage() {
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const created = sp.get('created')
  const queryClient = useQueryClient()
  const { accessToken } = useAuth()
  
  const [activeTab, setActiveTab] = useState<TabType>('social-analysis')
  const [editingQuestion, setEditingQuestion] = useState<UserQuestion | null>(null)
  const [deletingQuestion, setDeletingQuestion] = useState<UserQuestion | null>(null)
  const [editingInsight, setEditingInsight] = useState<Insight | null>(null)
  const [deletingInsight, setDeletingInsight] = useState<Insight | null>(null)
  
  const { data: questions, isLoading: questionsLoading, error: questionsError, refetch: refetchQuestions } = useMyQuestions()
  const { data: answers, isLoading: answersLoading, error: answersError, refetch: refetchAnswers } = useMyAnswers()
  const { data: socialAnalysisAnswers, isLoading: socialAnalysisLoading, error: socialAnalysisError, refetch: refetchSocialAnalysis } = useMySocialAnalysisAnswers()
  const { data: insights, isLoading: insightsLoading, error: insightsError, refetch: refetchInsights } = useMyInsights()

  useEffect(() => { 
    if (created) {
      refetchQuestions()
      refetchAnswers()
      refetchSocialAnalysis()
      refetchInsights()
    }
  }, [created, refetchQuestions, refetchAnswers, refetchSocialAnalysis, refetchInsights])

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<UserQuestion> }) => {
      return updateQuestion(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-questions'] })
      setEditingQuestion(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return deleteQuestion(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-questions'] })
      setDeletingQuestion(null)
    },
  })

  const updateInsightMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Insight> }) => {
      return updateInsight(id, data, accessToken || undefined)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-insights'] })
      setEditingInsight(null)
    },
  })

  const deleteInsightMutation = useMutation({
    mutationFn: async (id: number) => {
      return deleteInsight(id, accessToken || undefined)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-insights'] })
      setDeletingInsight(null)
    },
  })

  const handleEdit = (question: UserQuestion) => {
    setEditingQuestion(question)
  }

  const handleDelete = (question: UserQuestion) => {
    setDeletingQuestion(question)
  }

  const handleView = (questionId: number) => {
    navigate(`/questions/${questionId}`)
  }

  const isLoading = questionsLoading || answersLoading || socialAnalysisLoading || insightsLoading
  const hasError = questionsError || answersError || socialAnalysisError || insightsError

  if (isLoading) return <div className="p-6">불러오는 중…</div>
  if (hasError) return <div className="p-6 text-red-600">목록을 가져오지 못했습니다.</div>

  const hasContent = (socialAnalysisAnswers && socialAnalysisAnswers.length > 0) || (answers && answers.length > 0) || (insights && insights.length > 0)

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">내가 쓴 글</h1>
        <div className="flex gap-2">
          <Link
            to="/free-insight"
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700 transition-colors"
          >
            자유 통찰
          </Link>
          <Link
            to="/write"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 transition-colors"
          >
            새 글 작성
          </Link>
          <Link
            to="/"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            홈으로
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('social-analysis')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'social-analysis'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            현상 분석 ({socialAnalysisAnswers?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('answers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'answers'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            언어정의 ({answers?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'insights'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            자유통찰 ({insights?.length || 0})
          </button>
        </nav>
      </div>

      {!hasContent && (
        <div className="text-center py-12">
          <p className="text-neutral-500 mb-4">아직 작성한 글이 없습니다.</p>
          <Link
            to="/write"
            className="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-white hover:bg-emerald-700 transition-colors"
          >
            첫 글 작성하기
          </Link>
        </div>
      )}

      {/* Social Analysis Answers Section */}
      {activeTab === 'social-analysis' && socialAnalysisAnswers && socialAnalysisAnswers.length > 0 && (
        <div className="mb-8">
          <div className="space-y-4">
            {socialAnalysisAnswers.map((answer) => (
              <div key={answer.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex-1">
                  {answer.title && (
                    <h3 className="font-semibold text-gray-900 mb-2">{answer.title}</h3>
                  )}
                  <p className="text-gray-700 mb-3 line-clamp-3">{answer.body}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>질문: {answer.Question.title}</span>
                    <span>{new Date(answer.createdAt).toLocaleString('ko-KR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answers Section */}
      {activeTab === 'answers' && answers && answers.length > 0 && (
        <div>
          <div className="space-y-4">
            {answers.map((answer) => (
              <div key={answer.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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

      {/* Insights Section */}
      {activeTab === 'insights' && insights && insights.length > 0 && (
        <div>
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="mb-2">
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {insight.topic}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{insight.title}</h3>
                    <p className="text-gray-700 mb-3 line-clamp-3">{insight.body}</p>
                    <div className="text-sm text-gray-500">
                      {new Date(insight.createdAt).toLocaleString('ko-KR')}
                      {insight.updatedAt !== insight.createdAt && (
                        <span className="ml-2">(수정됨)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingInsight(insight)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="수정"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeletingInsight(insight)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No content in current tab */}
      {activeTab === 'social-analysis' && (!socialAnalysisAnswers || socialAnalysisAnswers.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500">아직 현상 분석 답변이 없습니다.</p>
        </div>
      )}
      
      {activeTab === 'answers' && (!answers || answers.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500">아직 작성한 답변이 없습니다.</p>
        </div>
      )}
      
      {activeTab === 'insights' && (!insights || insights.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">아직 작성한 통찰이 없습니다.</p>
          <Link
            to="/free-insight"
            className="inline-block rounded-lg bg-purple-600 px-6 py-3 text-white hover:bg-purple-700 transition-colors"
          >
            첫 통찰 작성하기
          </Link>
        </div>
      )}


      {/* Edit Modal */}
      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSave={(data) => updateMutation.mutate({ id: editingQuestion.id, data })}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingQuestion && (
        <DeleteConfirmModal
          question={deletingQuestion}
          onClose={() => setDeletingQuestion(null)}
          onConfirm={() => deleteMutation.mutate(deletingQuestion.id)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {/* Edit Insight Modal */}
      {editingInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">통찰 수정</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateInsightMutation.mutate({
                  id: editingInsight.id,
                  data: {
                    topic: formData.get('topic') as string,
                    title: formData.get('title') as string,
                    body: formData.get('body') as string,
                  },
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주제</label>
                <input
                  name="topic"
                  defaultValue={editingInsight.topic}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  name="title"
                  defaultValue={editingInsight.title}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  maxLength={200}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                <textarea
                  name="body"
                  defaultValue={editingInsight.body}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingInsight(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={updateInsightMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {updateInsightMutation.isPending ? '수정 중...' : '수정'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Insight Confirmation Modal */}
      {deletingInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">통찰 삭제</h2>
            <p className="text-gray-600 mb-6">
              정말로 "{deletingInsight.title}" 통찰을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingInsight(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => deleteInsightMutation.mutate(deletingInsight.id)}
                disabled={deleteInsightMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {deleteInsightMutation.isPending ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}