import { useState } from 'react'
import { login, me, logout } from '@/shared/api/auth'
import { createAnswer } from '@/shared/api/answers'
import { createComment } from '@/shared/api/comments'
import { token } from '@/shared/lib/token'

type Debug = { step: string; ok: boolean; info?: any }

export default function E2EFlow() {
  const [email, setEmail] = useState('test@rezom.org')
  const [password, setPassword] = useState('Rezom!123')
  const [questionId, setQuestionId] = useState<number>(1)
  const [answerBody, setAnswerBody] = useState('연결 테스트용 답변입니다.')
  const [commentBody, setCommentBody] = useState('연결 테스트용 댓글입니다.')
  const [log, setLog] = useState<string[]>([])
  const [debugs, setDebugs] = useState<Debug[]>([])

  const push = (l: string) => setLog((xs) => [l, ...xs].slice(0, 100))
  const pushDbg = (d: Debug) => setDebugs((xs) => [d, ...xs].slice(0, 50))

  const explainErr = (e: any) => {
    const status = e?.response?.status
    const data = e?.response?.data
    const msg = e?.message ?? 'unknown error'
    return { status, data, msg }
  }

  const doLogin = async () => {
    push('로그인 시도...')
    pushDbg({ step: 'login:start', ok: true, info: { email } })
    try {
      await login({ email, password })
      const m = await me()
      push(`로그인 성공: ${m?.name ?? 'me ok'}`)
      pushDbg({ step: 'login:success', ok: true, info: { me: m, token: token.get() ? 'set' : 'missing' } })
    } catch (e) {
      const info = explainErr(e)
      push(`❌ 로그인 실패: ${info.msg} (status: ${info.status})`)
      pushDbg({ step: 'login:error', ok: false, info })
    }
  }

  const doAnswer = async () => {
    push('답변 작성 시도...')
    pushDbg({ step: 'answer:start', ok: true, info: { questionId, hasToken: !!token.get() } })
    try {
      const a = await createAnswer({ questionId, body: answerBody })
      push(`답변 작성 성공: #${a?.id ?? '?'} (Q:${questionId})`)
      pushDbg({ step: 'answer:success', ok: true, info: a })
      setAnswerBody('')
    } catch (e) {
      const info = explainErr(e)
      push(`❌ 답변 작성 실패: ${info.msg} (status: ${info.status})`)
      pushDbg({ step: 'answer:error', ok: false, info })
    }
  }

  const doComment = async () => {
    push('댓글 작성 시도...')
    pushDbg({ step: 'comment:start', ok: true, info: { questionId, hasToken: !!token.get() } })
    try {
      const c = await createComment({ questionId, body: commentBody })
      push(`댓글 작성 성공: #${c?.id ?? '?'} (Q:${questionId})`)
      pushDbg({ step: 'comment:success', ok: true, info: c })
      setCommentBody('')
    } catch (e) {
      const info = explainErr(e)
      push(`❌ 댓글 작성 실패: ${info.msg} (status: ${info.status})`)
      pushDbg({ step: 'comment:error', ok: false, info })
    }
  }

  const doLogout = async () => {
    push('로그아웃 시도...')
    try {
      await logout()
      push('로그아웃 완료')
      pushDbg({ step: 'logout:success', ok: true })
    } catch (e) {
      const info = explainErr(e)
      push(`❌ 로그아웃 실패: ${info.msg} (status: ${info.status})`)
      pushDbg({ step: 'logout:error', ok: false, info })
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">E2E 연결 테스트</h1>

      <section className="space-y-2">
        <h2 className="font-semibold">1) 로그인</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input className="rounded border px-3 py-2" placeholder="email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="password" type="password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={doLogin} className="rounded bg-emerald-600 px-4 py-2 text-white">로그인</button>
          <button onClick={doLogout} className="rounded bg-neutral-700 px-4 py-2 text-white">로그아웃</button>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">2) 답변 작성</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input className="rounded border px-3 py-2" type="number" min={1}
            value={questionId} onChange={(e) => setQuestionId(parseInt(e.target.value || '0', 10))} />
          <input className="col-span-2 rounded border px-3 py-2" placeholder="answer body"
            value={answerBody} onChange={(e) => setAnswerBody(e.target.value)} />
        </div>
        <button onClick={doAnswer} className="rounded bg-blue-600 px-4 py-2 text-white">답변 작성</button>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">3) 댓글 작성</h2>
        <input className="w-full rounded border px-3 py-2" placeholder="comment body"
          value={commentBody} onChange={(e) => setCommentBody(e.target.value)} />
        <button onClick={doComment} className="rounded bg-indigo-600 px-4 py-2 text-white">댓글 작성</button>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">로그</h2>
        <ul className="space-y-1">
          {log.map((l, i) => <li key={i} className="text-sm text-neutral-700">• {l}</li>)}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">디버그</h2>
        <pre className="whitespace-pre-wrap rounded border bg-neutral-50 p-3 text-xs">
{JSON.stringify(debugs, null, 2)}
        </pre>
      </section>
    </main>
  )
}
