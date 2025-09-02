import { api } from '@/shared/lib/axios'

export type Question = {
  id: number
  title: string
  body: string
  authorId: number
  tags?: string[]
  createdAt?: string
}

export type QuestionCreateDto = { 
  title: string
  body: string
  categoryId?: number
  tags?: string[]
  conceptSlug: string
  keywords: string[]
}

export async function createQuestion(dto: QuestionCreateDto): Promise<Question> {
  const { data } = await api.post('/questions', dto)
  return data
}

export async function getQuestion(id: number): Promise<Question> {
  const { data } = await api.get(`/questions/${id}`)
  return data
}

export async function listMyQuestions(): Promise<Question[]> {
  const { data } = await api.get('/users/me/questions')
  return data
}

/** ===== 오늘의 질문 ===== */
export type DailyQuestionResponse = { question: unknown }  // ← 어떤 형태든 허용

export async function getDailyQuestion(): Promise<DailyQuestionResponse> {
  const { data } = await api.get('/questions/daily')
  return data
}

/** 어떤 형태로 와도 텍스트만 뽑아내는 헬퍼 */
export function extractDailyText(input: unknown): string {
  try {
    // 1) 문자열인 경우
    if (typeof input === 'string') {
      const s = input.trim()
      // JSON 형태로 보이면 파싱해서 title/body/question을 집계
      if (s.startsWith('{') || s.startsWith('[')) {
        const obj = JSON.parse(s)
        return (
          (obj?.title as string) ||
          (obj?.body as string) ||
          (obj?.question as string) ||
          s
        )?.toString().trim()
      }
      return s
    }
    // 2) 객체인 경우
    if (input && typeof input === 'object') {
      const any = input as any
      return (
        (any.title as string) ||
        (any.body as string) ||
        (any.question as string) ||
        ''
      )?.toString().trim()
    }
    return ''
  } catch {
    return ''
  }
}
