// src/api/define.ts
import { api } from '@/shared/api/client';

export type Concept = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  createdById?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Suggestion = {
  id: number;
  conceptId: number;
  createdById?: number | null;
  keywords: string[];
  prompt?: string | null;
  suggestion: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  linkedQuestionId?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Question = {
  id: number;
  authorId: number;
  categoryId: number;
  title: string;
  body: string;
  tags: string[];
  isDaily: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ConceptKeyword = {
  id: number;
  conceptId: number;
  keyword: string;
  position: number;
  active: boolean;
  currentQuestionId?: number | null;
  createdAt: string;
  updatedAt: string;
};

// Answer types with title field
export type Answer = {
  id: number;
  questionId: number;
  authorId: number;
  title?: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  User: {
    id: number;
    email: string;
  };
};

export type CreateAnswerRequest = {
  questionId: number;
  title?: string;
  body: string;
};

// 개념 상세 + 그래프(이웃, 엣지) — 필요 시 타입 확장
export async function getConcept(slug: string) {
  return api<{ concept: Concept; neighbors: Concept[]; edges: any[] }>(
    `/define/concepts/${slug}`,
    { withCredentials: true }
  );
}

// 제안 목록
export async function listSuggestions(slug: string) {
  return api<Suggestion[]>(`/define/concepts/${slug}/suggestions`, {
    withCredentials: true,
  });
}

// 제안 생성 (쿠키 CSRF + withCredentials)
export async function postSuggest(slug: string, keywords: string[]) {
  return api<Suggestion>(`/define/concepts/${slug}/suggest`, {
    method: 'POST',
    json: { keywords },
    withCsrf: true,
    withCredentials: true,
  });
}

// 제안 승인 → 질문 생성 (권한 필요: Bearer + CSRF + 쿠키)
export async function approveSuggestion(
  slug: string,
  suggestionId: number,
  accessToken: string
) {
  return api<Question>(`/define/concepts/${slug}/approve`, {
    method: 'POST',
    json: { suggestionId },
    withCsrf: true,
    withCredentials: true,
    accessToken, // Authorization: Bearer ...
  });
}

// 질문 목록
export async function listQuestions(
    slug: string,
    opts?: number | { limit?: number }
  ) {
    const limit = typeof opts === 'number' ? opts : opts?.limit ?? 10;
    return api<Question[]>(
      `/define/concepts/${slug}/questions`,
      { query: { limit }, withCredentials: true }
    );
}

// 키워드 목록 (returns Top-5 format if available, fallback to ConceptKeyword)
export type TopFiveKeyword = {
  label: string;
  questionId: number;
  rank: number;
};

// Helper function to extract key terms from question titles
function extractKeywordFromTitle(title: string): string {
  // Remove common question patterns and extract the main concept
  const cleaned = title
    .replace(/\?+$/, '') // Remove trailing question marks
    .replace(/^(.+?)(이란|란|는|은|의|이|가)\s*(무엇일까요?|뭐일까요?|무엇인가요?|뭔가요?|뭐에요?)$/i, '$1') // Extract core concept before "이란 무엇일까요?" patterns
    .replace(/^(.+?)(이란|란|는|은|의|이|가)\s*(.+)$/i, '$1') // Extract first part before particles
    .trim();
  
  // If extraction resulted in something meaningful and shorter, use it
  if (cleaned.length > 0 && cleaned.length < title.length * 0.7) {
    return cleaned;
  }
  
  // Otherwise return original title
  return title;
}

export async function getKeywords(slug: string): Promise<ConceptKeyword[] | TopFiveKeyword[]> {
  try {
    // First try to get Top-5 questions from the new endpoint
    const top5Data = await api<TopFiveQuestion[]>(`/define/${slug}/top5`, {
      withCredentials: true,
    });
    
    // Transform to TopFiveKeyword format for consistency
    return top5Data.map(item => ({
      label: item.keywordLabel || extractKeywordFromTitle(item.title), // Extract keyword from title if keywordLabel not available
      questionId: item.questionId,
      rank: item.rank,
    }));
  } catch (error) {
    // Fallback to the original keywords endpoint
    console.log(`No top5 data for ${slug}, falling back to keywords`);
    const conceptKeywords = await api<ConceptKeyword[]>(`/define/concepts/${slug}/keywords`, {
      withCredentials: true,
    });
    
    // Also apply keyword extraction to fallback data
    return conceptKeywords.map(item => ({
      ...item,
      keyword: extractKeywordFromTitle(item.keyword),
    }));
  }
}

// Get Top-5 questions for a concept
export type TopFiveQuestion = {
  questionId: number;
  title: string;
  content: string;
  keywordLabel: string | null;
  rank: number;
  tags: string[];
  createdAt: string;
};

export async function getTop5Questions(slug: string) {
  return api<TopFiveQuestion[]>(`/define/${slug}/top5`, {
    withCredentials: true,
  });
}

// Get individual question details
export type QuestionDetail = {
  id: number;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  isDaily: boolean;
  keywordLabel: string | null;
  authorId?: number; // Add authorId for ownership checking
};

export async function getQuestionDetail(slug: string, questionId: number) {
  return api<QuestionDetail>(`/define/${slug}/questions/${questionId}`, {
    withCredentials: true,
  });
}

// Enhanced question creation (supports new admin features)
export type CreateQuestionRequest = {
  title: string;
  content?: string; // New field for CLI compatibility
  body?: string; // Existing field
  tags?: string[];
  conceptSlug?: string; // Link to concept
  keywords?: string[]; // Auto-create keywords
  setDaily?: boolean; // Set as daily question
};

export async function createQuestion(
  data: CreateQuestionRequest,
  accessToken?: string
): Promise<Question> {
  return api<Question>('/questions', {
    method: 'POST',
    json: data,
    withCsrf: true,
    withCredentials: true,
    ...(accessToken && { accessToken }),
  });
}

// Get answers for a question
export async function getAnswers(questionId: number): Promise<Answer[]> {
  return api<Answer[]>(`/answers/question/${questionId}`, {
    withCredentials: true,
  });
}

// Get a single answer by ID
export async function getAnswerById(answerId: number): Promise<Answer> {
  return api<Answer>(`/answers/${answerId}`, {
    withCredentials: true,
  });
}

// Submit an answer to a question
export async function createAnswer(
  data: CreateAnswerRequest,
  accessToken?: string
): Promise<Answer> {
  return api<Answer>('/answers', {
    method: 'POST',
    json: data,
    withCsrf: true,
    withCredentials: true,
    ...(accessToken && { accessToken }),
  });
}

// Update an answer
export async function updateAnswer(
  id: number,
  data: { title?: string; body: string },
  accessToken?: string
): Promise<Answer> {
  return api<Answer>(`/answers/${id}`, {
    method: 'PUT',
    json: data,
    withCsrf: true,
    withCredentials: true,
    ...(accessToken && { accessToken }),
  });
}

// Delete an answer
export async function deleteAnswer(
  id: number,
  accessToken?: string
): Promise<Answer> {
  return api<Answer>(`/answers/${id}`, {
    method: 'DELETE',
    withCsrf: true,
    withCredentials: true,
    ...(accessToken && { accessToken }),
  });
}

// Comment types
export type Comment = {
  id: number;
  authorId: number;
  questionId?: number | null;
  answerId?: number | null;
  body: string;
  createdAt: string;
  User: {
    id: number;
    email: string;
    displayName: string;
  };
};

export type CreateCommentRequest = {
  questionId?: number;
  answerId?: number;
  body: string;
};

// Get comments for an answer
export async function getAnswerComments(answerId: number): Promise<Comment[]> {
  return api<Comment[]>(`/comments/answer/${answerId}`, {
    withCredentials: true,
  });
}

// Get comments for a question
export async function getQuestionComments(questionId: number): Promise<Comment[]> {
  return api<Comment[]>(`/comments/question/${questionId}`, {
    withCredentials: true,
  });
}

// Create a comment
export async function createComment(
  data: CreateCommentRequest,
  accessToken?: string
): Promise<Comment> {
  return api<Comment>('/comments', {
    method: 'POST',
    json: data,
    withCsrf: true,
    withCredentials: true,
    ...(accessToken && { accessToken }),
  });
}

// Update a comment
export async function updateComment(
  id: number,
  data: { body: string },
  accessToken?: string
): Promise<Comment> {
  return api<Comment>(`/comments/${id}`, {
    method: 'PUT',
    json: data,
    withCsrf: true,
    withCredentials: true,
    ...(accessToken && { accessToken }),
  });
}

// Delete a comment
export async function deleteComment(
  id: number,
  accessToken?: string
): Promise<void> {
  return api<void>(`/comments/${id}`, {
    method: 'DELETE',
    withCsrf: true,
    withCredentials: true,
    ...(accessToken && { accessToken }),
  });
}
