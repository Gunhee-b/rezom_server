import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/routes/LoginPage2';
import { SimpleDashboard } from '@/routes/SimpleDashboard';
import { SimpleQuestionsPage } from '@/routes/SimpleQuestionsPage';
import { SimpleTop5Page } from '@/routes/SimpleTop5Page';
import { RequireAdmin } from '@/routes/RequireAdmin';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/dashboard', element: <RequireAdmin><SimpleDashboard /></RequireAdmin> },
  { path: '/questions', element: <RequireAdmin><SimpleQuestionsPage /></RequireAdmin> },
  { path: '/top5', element: <RequireAdmin><SimpleTop5Page /></RequireAdmin> },
]);
