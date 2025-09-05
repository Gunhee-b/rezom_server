import { api } from '@/shared/lib/axios'
export type AnswerCreateDto = { questionId: number; body: string }
export async function createAnswer(dto: AnswerCreateDto) {
  const { data } = await api.post('/answers', dto)
  return data
}
