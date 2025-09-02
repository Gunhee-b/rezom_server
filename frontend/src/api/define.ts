// src/api/define.ts
import { api } from './client';

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

export async function getKeywords(slug: string): Promise<ConceptKeyword[] | TopFiveKeyword[]> {
  return api<ConceptKeyword[] | TopFiveKeyword[]>(`/define/concepts/${slug}/keywords`, {
    withCredentials: true,
  });
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
