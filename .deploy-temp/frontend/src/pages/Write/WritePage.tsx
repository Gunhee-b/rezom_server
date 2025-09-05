import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { createQuestion } from '@/shared/api/questions'
import { getDailyQuestion, type DailyQuestionResponse, extractDailyText } from '@/shared/api/questions'
import { getQuestionDetail, type QuestionDetail } from '@/api/define'
import { EnhancedQuestionForm } from '@/components/EnhancedQuestionForm'

export default function WritePage() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  
  // URL parameters with precedence
  const urlQuestionId = searchParams.get('questionId')
  const urlSlug = searchParams.get('slug')
  const keyword = searchParams.get('keyword') // legacy support
  
  // sessionStorage fallback
  const sessionQuestionId = sessionStorage.getItem('lastQuestionId')
  const sessionSlug = sessionStorage.getItem('lastConceptSlug')
  
  // Determine which question to load based on precedence
  const targetQuestionId = urlQuestionId || sessionQuestionId
  const targetSlug = urlSlug || sessionSlug || 'language-definition'
  
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [useEnhancedForm, setUseEnhancedForm] = useState(false)

  // Set initial tag if keyword is provided (legacy support)
  useEffect(() => {
    if (keyword) {
      setTags(keyword)
    }
  }, [keyword])

  // Fetch current question with precedence
  const { data: currentQuestion, isLoading: currentQuestionLoading } = useQuery<QuestionDetail>({
    queryKey: ['current-question', targetSlug, targetQuestionId],
    queryFn: () => getQuestionDetail(targetSlug, parseInt(targetQuestionId!)),
    enabled: !!targetQuestionId && !!targetSlug,
  })

  // Fallback to daily question
  const { data: dq, isLoading: dqLoading } = useQuery<DailyQuestionResponse>({
    queryKey: ['daily-question'],
    queryFn: getDailyQuestion,
    enabled: !targetQuestionId, // Only fetch daily if no specific question
  })

  // Determine which prompt to show with precedence
  const promptQuestion = currentQuestion || (dq ? extractDailyText(dq.question) : null)
  const promptSource = currentQuestion ? 'current' : 'daily'
  const isLoadingPrompt = currentQuestionLoading || (dqLoading && !targetQuestionId)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
      
      // Prepare the question data with required fields
      const questionData = {
        title,
        body,
        tags: tagList,
        conceptSlug: targetSlug || 'language-definition', // Use targetSlug or default
        keywords: keyword ? [keyword] : tagList.length > 0 ? [tagList[0]] : ['General'], // Use keyword, first tag, or default
      }
      
      const q = await createQuestion(questionData)
      
      // Navigate after successful question creation - always go to user's questions
      if (keyword) {
        // User was writing for a specific keyword - go to that define page
        nav(`/define/${keyword}`, { replace: true })
      } else {
        // Always go to user's questions list with the new question highlighted
        nav(`/users/me/questions?created=${q.id}`, { replace: true })
      }
    } catch (e: any) {
      // Check for 401 Unauthorized error
      if (e?.response?.status === 401 || e?.message?.includes('401')) {
        setErr('로그인이 필요합니다. 홈페이지로 이동합니다...')
        // Store current URL to return after login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search)
        // Redirect to home page where login functionality is located
        setTimeout(() => {
          nav('/')
        }, 2000)
      } else {
        setErr(e?.message || '작성에 실패했습니다.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEnhancedFormSuccess = (question: any) => {
    setErr(null)
    
    // Navigate after successful question creation - always go to user's questions
    if (keyword) {
      // User was writing for a specific keyword - go to that define page
      nav(`/define/${keyword}`, { replace: true })
    } else {
      // Always go to user's questions list with the new question highlighted
      nav(`/users/me/questions?created=${question.id}`, { replace: true })
    }
  }

  const handleEnhancedFormError = (error: string) => {
    // Check for authentication error in the message
    if (error.includes('401') || error.includes('Unauthorized') || error.includes('로그인')) {
      setErr('로그인이 필요합니다. 홈페이지로 이동합니다...')
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search)
      setTimeout(() => {
        nav('/')
      }, 2000)
    } else {
      setErr(error)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Selected Question Banner */}
      {currentQuestion && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
              Q
            </div>
            <div className="text-xs font-medium text-emerald-700">
              선택된 질문
              {currentQuestion.keywordLabel && (
                <span className="ml-2 px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded text-xs">
                  {currentQuestion.keywordLabel}
                </span>
              )}
            </div>
          </div>
          <h3 className="font-medium text-emerald-900 mb-1">{currentQuestion.title}</h3>
          <p className="text-sm text-emerald-800 line-clamp-2">{currentQuestion.content}</p>
        </div>
      )}

      {/* Daily Question Prompt (fallback) */}
      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="mb-1 text-xs font-medium text-emerald-700">
          {promptSource === 'current' ? '답할 질문' : '오늘의 질문'}
        </div>
        {isLoadingPrompt ? (
          <div className="h-6 w-3/4 animate-pulse rounded bg-emerald-200" />
        ) : promptQuestion ? (
          <p className="whitespace-pre-wrap text-emerald-900">
            {typeof promptQuestion === 'string' ? promptQuestion : promptQuestion.content}
          </p>
        ) : (
          <p className="text-emerald-900/70">질문을 불러오지 못했습니다.</p>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">
          {currentQuestion ? '질문에 답하기' : keyword ? `'${keyword}' 관련 질문 작성` : '새 글 작성'}
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">고급 기능</span>
          <button
            type="button"
            onClick={() => setUseEnhancedForm(!useEnhancedForm)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              useEnhancedForm ? 'bg-emerald-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                useEnhancedForm ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {useEnhancedForm && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          💡 고급 기능: 개념 연결, 자동 키워드 생성, 실시간 업데이트 지원
        </div>
      )}

      {useEnhancedForm ? (
        <EnhancedQuestionForm
          conceptSlug={keyword || ''}
          onSuccess={handleEnhancedFormSuccess}
          onError={handleEnhancedFormError}
        />
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="내용"
          rows={10}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="태그 (쉼표로 구분)"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {saving ? '작성 중…' : '작성'}
          </button>
          {!isLoadingPrompt && promptQuestion && (
            <button
              type="button"
              className="text-sm text-emerald-700 underline"
              onClick={() => setTitle((t) => t || (typeof promptQuestion === 'string' ? promptQuestion : promptQuestion.title || promptQuestion.content))}
            >
              질문을 제목으로 채우기
            </button>
          )}
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
      </form>
      )}

      {/* Show errors from either form */}
      {err && useEnhancedForm && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {err}
        </div>
      )}
    </div>
  )
}
