import { api } from '@/shared/lib/axios'
export type CommentCreateDto = { questionId: number; body: string }
export async function createComment(dto: CommentCreateDto) {
  const { data } = await api.post('/comments', dto)
  return data
}
