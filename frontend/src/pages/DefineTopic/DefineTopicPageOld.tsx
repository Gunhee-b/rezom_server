// src/pages/DefineTopic/DefineTopicPage.tsx
import { useMemo, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MindmapCanvas } from '@/widgets/mindmap/MindmapCanvas'
import { TOPIC_PRESETS } from '@/data/presets/topic'
import { makeTopicSchema } from './makeTopicSchema'

// ✅ 최소 동작용 API 래퍼들 (앞서 만든 src/api/define.ts)
import {
  listSuggestions,
  listQuestions,
  postSuggest,
  approveSuggestion,
  getKeywords,
  type Suggestion,
  type Question,
  type ConceptKeyword,
} from '@/api/define'

// ✅ 클라이언트 로그인 상태 감지 (당신 프로젝트의 토큰 유틸)
import { token } from '@/shared/lib/token'

// ✅ SSE hook for live updates
import { useConceptUpdates, type ConceptUpdateEvent } from '@/hooks/useConceptUpdates'

// ✅ UI Components
import { LiveUpdateStatus } from '@/components/LiveUpdateStatus'
import { KeywordsDisplay } from '@/components/KeywordsDisplay'

function cap(s: string) {
  return s.slice(0, 1).toUpperCase() + s.slice(1)
}

export default function DefineTopicPage() {
  const { slug = 'happiness' } = useParams<{ slug: string }>()
  const queryClient = useQueryClient()
  
  // ----- Live Updates State -----
  const [liveUpdateCount, setLiveUpdateCount] = useState(0)
  const [lastUpdateMessage, setLastUpdateMessage] = useState<string | null>(null)

  // ----- 기존 Mindmap 렌더링 -----
  const preset = TOPIC_PRESETS[slug.toLowerCase()] ?? TOPIC_PRESETS.happiness
  const schema = useMemo(() => {
    const baseSchema = makeTopicSchema(cap(slug), preset.question, preset.others)
    
    // Add "Write" node to the schema
    const writeNode = {
      id: 'write-node',
      x: 85,
      y: 50,
      label: 'Write',
      size: 'sm' as const,
      to: `/write?keyword=${slug}`
    }
    
    const writeEdge = {
      id: 'write-edge',
      from: baseSchema.nodes[0].id,
      to: 'write-node',
      style: 'green' as const,
      curvature: 0.2
    }
    
    return {
      ...baseSchema,
      nodes: [...baseSchema.nodes, writeNode],
      edges: [...baseSchema.edges, writeEdge]
    }
  }, [slug, preset])

  // ----- 로그인 여부 (미로그인 시 제안/승인 버튼 비활성) -----
  const authed = localStorage.getItem('authed') === '1' || !!token.get()

  // ----- 제안 입력 상태 -----
  const [kwInput, setKwInput] = useState('')
  const [submitErr, setSubmitErr] = useState<string | null>(null)

  // ----- Queries: 제안 목록 / 생성된 질문 목록 / 키워드 -----
  const { data: suggestions, isLoading: suggLoading } = useQuery<Suggestion[]>({
    queryKey: ['define', 'suggestions', slug],
    queryFn: () => listSuggestions(slug),
  })

  const { data: questions, isLoading: qLoading, refetch: refetchQuestions } = useQuery<Question[]>({
    queryKey: ['define', 'questions', slug, { limit: 20 }],
    queryFn: () => listQuestions(slug, { limit: 20 }),
  })

  const { data: keywords, isLoading: keywordsLoading, refetch: refetchKeywords } = useQuery({
    queryKey: ['define', 'keywords', slug],
    queryFn: () => getKeywords(slug),
  })

  // ----- 제안 생성 뮤테이션 -----
  const suggestMut = useMutation({
    mutationFn: async (keywords: string[]) => postSuggest(slug, keywords),
    onSuccess: () => {
      setKwInput('')
      setSubmitErr(null)
      queryClient.invalidateQueries({ queryKey: ['define', 'suggestions', slug] })
    },
    onError: (err: any) => {
      // 서버가 {"ok":false,"error":{"message":"Bad CSRF token"...}} 형식이면 메시지 노출
      const msg =
        err?.body?.error?.message ||
        err?.message ||
        '제안에 실패했습니다.'
      setSubmitErr(msg)
    },
  })

  // ----- (선택) 제안 승인: 관리자/권한자만 UI 제공 예정 -----
  const approveMut = useMutation({
    mutationFn: async (suggestionId: number) =>
      approveSuggestion(slug, suggestionId, token.get() ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['define', 'suggestions', slug] })
      queryClient.invalidateQueries({ queryKey: ['define', 'questions', slug] })
    },
  })

  // ----- Live Updates via SSE -----
  const handleLiveUpdate = useCallback((event: ConceptUpdateEvent) => {
    setLiveUpdateCount(prev => prev + 1)
    
    if (event.data?.action === 'question-created') {
      setLastUpdateMessage(`새 질문이 생성되었습니다: "${event.data.questionTitle}"`)
      
      // Automatically refetch questions and keywords
      refetchQuestions()
      refetchKeywords()
      
      // Also invalidate related queries in cache
      queryClient.invalidateQueries({ queryKey: ['define', 'questions', slug] })
      queryClient.invalidateQueries({ queryKey: ['define', 'keywords', slug] })
      
      // Clear message after 5 seconds
      setTimeout(() => setLastUpdateMessage(null), 5000)
    }
  }, [refetchQuestions, refetchKeywords, queryClient, slug])

  const { isConnected, error: sseError } = useConceptUpdates(slug, {
    enabled: false, // TEMPORARILY DISABLED to prevent network spam
    onUpdate: handleLiveUpdate,
    onError: (error) => {
      console.warn('SSE connection error:', error)
    },
  })

  // ✅ onSuggestSubmit: 존재하지 않던 메서드 구현
  async function onSuggestSubmit() {
    if (!authed) {
      setSubmitErr('로그인 후 이용 가능합니다.')
      return
    }
    const keywords = kwInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (keywords.length === 0) {
      setSubmitErr('키워드를 한 개 이상 입력해 주세요.')
      return
    }
    suggestMut.mutate(keywords)
  }

  return (
    <main className="min-h-screen bg-neutral-50 pt-6">
      {/* Live Update Status */}
      <LiveUpdateStatus
        isConnected={isConnected}
        error={sseError}
        updateCount={liveUpdateCount}
        lastMessage={lastUpdateMessage}
      />

      {/* 상단 마인드맵 */}
      <MindmapCanvas schema={schema} />

      {/* 구분선 */}
      <hr className="mt-8 border-neutral-200" />

      {/* 현재 키워드 섹션 */}
      <section className="mx-auto mt-6 max-w-3xl px-4">
        <h2 className="mb-2 text-lg font-semibold">현재 키워드</h2>
        <KeywordsDisplay 
          keywords={Array.isArray(keywords) && keywords.length > 0 && 'id' in keywords[0] ? keywords as ConceptKeyword[] : []} 
          isLoading={keywordsLoading}
          showInactive={false}
        />
      </section>

      {/* 새 질문 제안 섹션 */}
      <section className="mx-auto mt-6 max-w-3xl px-4">
        <h2 className="mb-2 text-lg font-semibold">새 질문 제안</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={kwInput}
            onChange={(e) => setKwInput(e.target.value)}
            placeholder="키워드를 콤마(,)로 구분해 입력 (예: art, obsession)"
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={!authed || suggestMut.isPending}
          />
          <button
            className="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
            onClick={onSuggestSubmit}
            disabled={!authed || suggestMut.isPending}
          >
            {suggestMut.isPending ? '제안 중…' : '제안'}
          </button>
        </div>
        {!authed && (
          <p className="mt-2 text-sm text-neutral-500">
            로그인 후 이용 가능합니다.
          </p>
        )}
        {submitErr && (
          <p className="mt-2 text-sm text-red-600">{submitErr}</p>
        )}
        <p className="mt-2 text-xs text-neutral-400">
          ※ 브라우저 쿠키 + CSRF 더블서밋으로 인증됩니다.
        </p>
      </section>

      {/* 제안 목록 */}
      <section className="mx-auto mt-8 max-w-3xl px-4">
        <h3 className="mb-2 text-base font-semibold">제안 목록</h3>
        {suggLoading ? (
          <p className="text-sm text-neutral-500">불러오는 중…</p>
        ) : suggestions && suggestions.length > 0 ? (
          <ul className="space-y-2">
            {suggestions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3"
              >
                <div>
                  <div className="font-medium">{s.suggestion}</div>
                  <div className="text-xs text-neutral-500">
                    keywords: {s.keywords.join(', ')} · status: {s.status}
                  </div>
                </div>
                {/* 관리자/권한자 영역: 일단 로그인 상태에서만 보이도록 */}
                <div className="flex items-center gap-2">
                  <button
                    className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                    onClick={() => approveMut.mutate(s.id)}
                    disabled={!authed || approveMut.isPending}
                    title={!authed ? '로그인 필요' : '승인하여 질문 생성'}
                  >
                    {approveMut.isPending ? '승인 중…' : '승인'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">아직 제안이 없습니다.</p>
        )}
      </section>

      {/* 생성된 질문 목록 */}
      <section className="mx-auto mt-8 mb-16 max-w-3xl px-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold">질문 목록</h3>
          <a 
            href={`/write?keyword=${slug}`}
            className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
          >
            새 질문 작성
          </a>
        </div>
        {qLoading ? (
          <p className="text-sm text-neutral-500">불러오는 중…</p>
        ) : questions && questions.length > 0 ? (
          <div className="space-y-3">
            {questions.map((q) => (
              <div
                key={q.id}
                className="rounded-lg border border-neutral-200 bg-white p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.location.href = `/questions/${q.id}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg mb-2">{q.title}</h4>
                    <p className="text-gray-600 text-sm line-clamp-2">{q.body}</p>
                    {q.tags?.length ? (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {q.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {q.isDaily && (
                    <span className="ml-3 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                      오늘의 질문
                    </span>
                  )}
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  {new Date(q.createdAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-neutral-500 mb-4">아직 생성된 질문이 없습니다.</p>
            <a 
              href={`/write?keyword=${slug}`}
              className="inline-block bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
            >
              첫 질문 작성하기
            </a>
          </div>
        )}
      </section>
    </main>
  )
}