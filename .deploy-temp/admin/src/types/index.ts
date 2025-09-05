export interface User {
  id: number;
  email: string;
  displayName?: string;
  role: 'ADMIN' | 'USER';
}

export interface Question {
  id: number;
  title: string;
  body?: string;
  content?: string;
  categoryId: number;
  authorId: number;
  tags: string[];
  keywords?: string[];
  isDaily: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionDto {
  title: string;
  content: string;
  conceptSlug: string;
  keywords: string[];
  tags: string[];
}

export interface Top5Question extends Question {
  rank: number;
  keywordLabel: string | null;
}

export interface ApiResponse<T = any> {
  ok?: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode: number;
  };
}

export interface Category {
  id: string;
  value: string;
  label: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AdminAuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}