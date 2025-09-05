import { api } from '@/shared/api/client';

// Insight types
export type Insight = {
  id: number;
  authorId: number;
  topic: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  User?: {
    id: number;
    email: string;
    displayName: string;
  };
};

export type CreateInsightRequest = {
  topic: string;
  title: string;
  body: string;
};

export type UpdateInsightRequest = {
  topic?: string;
  title?: string;
  body?: string;
};

// Get all insights
export async function getAllInsights(): Promise<Insight[]> {
  return api<Insight[]>('/insights', {
    withCredentials: true,
  });
}

// Get user's insights
export async function getUserInsights(userId: number): Promise<Insight[]> {
  return api<Insight[]>(`/insights/user/${userId}`, {
    withCredentials: true,
  });
}

// Get my insights
export async function getMyInsights(accessToken?: string): Promise<Insight[]> {
  return api<Insight[]>('/insights/my', {
    withCredentials: true,
    ...(accessToken && { accessToken }),
  });
}

// Get insights via users endpoint
export async function getMyInsightsViaUsers(accessToken?: string): Promise<Insight[]> {
  return api<Insight[]>('/users/me/insights', {
    withCredentials: true,
    ...(accessToken && { accessToken }),
  });
}

// Get single insight
export async function getInsight(id: number): Promise<Insight> {
  return api<Insight>(`/insights/${id}`, {
    withCredentials: true,
  });
}

// Create insight
export async function createInsight(
  data: CreateInsightRequest,
  accessToken?: string
): Promise<Insight> {
  return api<Insight>('/insights', {
    method: 'POST',
    json: data,
    withCsrf: true,
    withCredentials: true,
    ...(accessToken && { accessToken }),
  });
}

// Update insight
export async function updateInsight(
  id: number,
  data: UpdateInsightRequest,
  accessToken?: string
): Promise<Insight> {
  return api<Insight>(`/insights/${id}`, {
    method: 'PUT',
    json: data,
    withCsrf: true,
    withCredentials: true,
    ...(accessToken && { accessToken }),
  });
}

// Delete insight
export async function deleteInsight(
  id: number,
  accessToken?: string
): Promise<void> {
  return api<void>(`/insights/${id}`, {
    method: 'DELETE',
    withCsrf: true,
    withCredentials: true,
    ...(accessToken && { accessToken }),
  });
}