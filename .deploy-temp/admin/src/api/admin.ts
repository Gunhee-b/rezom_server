import { api } from './client'

export type Suggestion = {
  id: number
  conceptId: number
  keywords: string[]
  suggestion: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

export async function listSuggestions(slug: string) {
  return api<Suggestion[]>(`/define/concepts/${slug}/suggestions`, { withCredentials: true })
}

export async function approveSuggestion(slug: string, suggestionId: number, accessToken: string) {
  return api(`/define/concepts/${slug}/approve`, {
    method: 'POST',
    json: { suggestionId },
    withCsrf: true,
    accessToken,
    withCredentials: true,
  })
}