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

export async function listMyAnswers(): Promise<any[]> {
  const { data } = await api.get('/users/me/answers')
  return data
}

export async function listMySocialAnalysisAnswers(): Promise<any[]> {
  const { data } = await api.get('/users/me/answers')
  // Filter answers that are related to analyze world questions (categoryId: 4)
  return data.filter((answer: any) => 
    answer.Question?.categoryId === 4
  )
}

export async function updateQuestion(id: number, dto: Partial<QuestionCreateDto>): Promise<Question> {
  const { data } = await api.put(`/questions/${id}`, dto)
  return data
}

export async function deleteQuestion(id: number): Promise<Question> {
  const { data } = await api.delete(`/questions/${id}`)
  return data
}

export async function listMyQuestionsForConcept(conceptSlug: string): Promise<Question[]> {
  const { data: allMyQuestions } = await api.get('/users/me/questions')
  const { data: conceptQuestions } = await api.get(`/define/concepts/${conceptSlug}/questions?limit=100`)
  
  // Filter user's questions that belong to this concept
  const myQuestionIds = new Set(allMyQuestions.map((q: Question) => q.id))
  return conceptQuestions.filter((q: Question) => myQuestionIds.has(q.id))
}

/** ===== 오늘의 질문 ===== */
export type DailyQuestionResponse = { question: unknown }  // ← 어떤 형태든 허용

export async function getDailyQuestion(): Promise<DailyQuestionResponse> {
  const { data } = await api.get('/daily/question')
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
