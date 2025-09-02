import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationResult,
    type UseQueryResult,
  } from '@tanstack/react-query'
  import { createAnswer, type AnswerCreateDto } from '@/shared/api/answers'
  import { createComment } from '@/shared/api/comments'
  import { api } from '@/shared/lib/axios'
  import { listMyQuestions, type Question } from '@/shared/api/questions' // ✅ 정확한 이름
  
  export function useQuestion(id: number): UseQueryResult<Question> {
    return useQuery<Question>({
      queryKey: ['question', id],
      queryFn: async () => (await api.get(`/questions/${id}`)).data as Question,
      enabled: !!id,
    })
  }
  
  export function useMyQuestions(): UseQueryResult<Question[]> {  // ✅ listMyQuestions 사용
    return useQuery<Question[]>({
      queryKey: ['my-questions'],
      queryFn: () => listMyQuestions(),
    })
  }
  
  export function useCreateAnswer(): UseMutationResult<any, unknown, AnswerCreateDto> {
    const qc = useQueryClient()
    return useMutation<any, unknown, AnswerCreateDto>({
      mutationFn: (dto) => createAnswer(dto),
      onSuccess: (a) => {
        if (a?.questionId) {
          qc.invalidateQueries({ queryKey: ['answers', a.questionId] })
          qc.invalidateQueries({ queryKey: ['question', a.questionId] })
        }
      },
    })
  }
  
  export function useCreateComment(
    questionId: number
  ): UseMutationResult<any, unknown, string, { prev: any[] }> {
    const qc = useQueryClient()
    return useMutation<any, unknown, string, { prev: any[] }>({
      mutationFn: (body: string) => createComment({ questionId, body }),
      onMutate: async (body) => {
        await qc.cancelQueries({ queryKey: ['comments', questionId] })
        const prev = (qc.getQueryData<any[]>(['comments', questionId]) ?? [])
        qc.setQueryData(['comments', questionId], [{ id: Date.now(), body }, ...prev])
        return { prev }
      },
      onError: (_e, _v, ctx) => {
        if (ctx?.prev) qc.setQueryData(['comments', questionId], ctx.prev)
      },
      onSettled: () => {
        qc.invalidateQueries({ queryKey: ['comments', questionId] })
      },
    })
  }
  