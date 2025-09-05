import { api } from '@/shared/lib/axios'

export type SetDailyQuestionDto = {
  questionId: number
}

export type AdminResponse = {
  ok: boolean
  error?: string
}

export type Top5UpdateResponse = {
  success: boolean
  message: string
  questionIds: number[]
  conceptId: number
  error?: string
}

export async function setDailyQuestion(questionId: number): Promise<AdminResponse> {
  const { data } = await api.post('/admin/daily-question', { questionId })
  return data
}

export async function updateTop5Questions(slug: string, questionIds: number[]): Promise<Top5UpdateResponse> {
  const { data } = await api.post(`/admin/define/${slug}/top5`, { questionIds })
  return data
}

export async function purgeCacheScope(scope: string, slug?: string): Promise<AdminResponse> {
  const { data } = await api.post('/admin/cache/purge', { scope, slug })
  return data
}