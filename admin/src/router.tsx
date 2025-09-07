import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/routes/LoginPage';
import { SimpleDashboard } from '@/routes/SimpleDashboard';
import { SimpleQuestionsPage } from '@/routes/SimpleQuestionsPage';
import { LanguageDefinitionTop5Page } from '@/routes/LanguageDefinitionTop5Page';
import { AnalyzeWorldTop5Page } from '@/routes/AnalyzeWorldTop5Page';
import { TodaysQuestionPage } from '@/routes/TodaysQuestionPage';
import { AnalyzeWorldPage } from '@/routes/AnalyzeWorldPage';
import { RequireAdmin } from '@/routes/RequireAdmin';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/dashboard', element: <RequireAdmin><SimpleDashboard /></RequireAdmin> },
  { path: '/questions', element: <RequireAdmin><SimpleQuestionsPage /></RequireAdmin> },
  { path: '/language-definition-top5', element: <RequireAdmin><LanguageDefinitionTop5Page /></RequireAdmin> },
  { path: '/analyze-world-top5', element: <RequireAdmin><AnalyzeWorldTop5Page /></RequireAdmin> },
  { path: '/todays-question', element: <RequireAdmin><TodaysQuestionPage /></RequireAdmin> },
  { path: '/analyze-world', element: <RequireAdmin><AnalyzeWorldPage /></RequireAdmin> },
]);
