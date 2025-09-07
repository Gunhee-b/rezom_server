/**
 * Centralized Type Definitions
 * 
 * This file exports all shared types used across the application
 */

// API Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    status?: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// User & Auth Types
export interface User {
  id: number;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user?: User;
  accessToken?: string;
  refreshToken?: string;
}

// Question Types
export interface Question {
  id: number;
  title: string;
  content: string;
  authorId: number;
  author?: User;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
  likeCount?: number;
  answerCount?: number;
}

export interface Answer {
  id: number;
  questionId: number;
  content: string;
  authorId: number;
  author?: User;
  isAccepted?: boolean;
  createdAt: string;
  updatedAt: string;
  likeCount?: number;
}

// Concept/Definition Types
export interface Concept {
  id: string;
  name: string;
  definition?: string;
  category?: string;
  relatedConcepts?: string[];
  examples?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Writing Types
export interface WritingProject {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'published';
  authorId: number;
  author?: User;
  content?: string;
  wordCount?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Navigation Types
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  children?: NavigationItem[];
  requiresAuth?: boolean;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio';
  placeholder?: string;
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    message?: string;
  };
  options?: Array<{ value: string; label: string }>;
}

// UI Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Re-export schema types
export * from './schemas';

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};