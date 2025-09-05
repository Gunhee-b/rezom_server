import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import RequireAuth from '@/shared/router/RequireAuth';
import RouteErrorBoundary from '@/app/RouteErrorBoundary';
import {
  PUBLIC_ROUTES,
  PROTECTED_ROUTES,
  COMING_SOON_ROUTES,
  DEV_ROUTES,
  DEPRECATED_ROUTES,
  COMING_SOON_MESSAGES,
} from './routes';

// Lazy load pages for better code splitting
const HomePage = lazy(() => import('@/pages/HomePage/Homepage'));
const ProfilePage = lazy(() => import('@/pages/Profile/ProfilePage'));
const WritingHubPage = lazy(() => import('@/pages/WritingHub/WritingHubPage'));
const DefinePage = lazy(() => import('@/pages/Define/DefinePage'));
const WritePage = lazy(() => import('@/pages/Write/WritePage'));
const QuestionDetail = lazy(() => import('@/pages/Questions/Detail'));
const E2EFlow = lazy(() => import('@/pages/Dev/E2EFlow'));
const MyQuestionsPage = lazy(() => import('@/pages/MyQuestions/MyQuestionsPage'));
const AnswerDetailPage = lazy(() => import('@/pages/AnswerDetail/AnswerDetailPage'));
const RegisterPage = lazy(() => import('@/pages/Auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPassword/ResetPasswordPage'));
const FreeInsightPage = lazy(() => import('@/pages/FreeInsight/FreeInsightPage'));
const TodaysQuestionPage = lazy(() => import('@/pages/TodaysQuestion/TodaysQuestionPage'));
const AdminPage = lazy(() => import('@/pages/Admin/AdminPage'));
const TodaysQuestionAdmin = lazy(() => import('@/pages/Admin/TodaysQuestionAdmin'));
const AnalyzeWorldAdmin = lazy(() => import('@/pages/Admin/AnalyzeWorldAdmin'));
const AnalyzePage = lazy(() => import('@/pages/Analyze/AnalyzePage'));

// Loading component for lazy loaded pages
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
  </div>
);

// Wrapper for lazy loaded components
const LazyPage = ({ Component }: { Component: React.ComponentType }) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// Coming Soon component
const ComingSoon = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Coming Soon</h2>
      <p className="text-neutral-600">{message}</p>
    </div>
  </div>
);

export const router = createBrowserRouter([
  // Public routes
  {
    path: PUBLIC_ROUTES.HOME,
    element: <LazyPage Component={HomePage} />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: PUBLIC_ROUTES.SIGN_UP,
    element: <LazyPage Component={RegisterPage} />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: PUBLIC_ROUTES.FORGOT_PASSWORD,
    element: <LazyPage Component={ForgotPasswordPage} />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: PUBLIC_ROUTES.RESET_PASSWORD,
    element: <LazyPage Component={ResetPasswordPage} />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: PUBLIC_ROUTES.QUESTION_DETAIL,
    element: <LazyPage Component={QuestionDetail} />,
    errorElement: <RouteErrorBoundary />,
  },

  // Protected routes
  {
    path: '/',
    element: <RequireAuth />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: PROTECTED_ROUTES.PROFILE,
        element: <LazyPage Component={ProfilePage} />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: PROTECTED_ROUTES.WRITING_HUB,
        element: <LazyPage Component={WritingHubPage} />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: PROTECTED_ROUTES.DEFINE,
        element: <LazyPage Component={DefinePage} />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: PROTECTED_ROUTES.DEFINE_TOPIC,
        element: <LazyPage Component={DefinePage} />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: PROTECTED_ROUTES.ANALYZE,
        element: <LazyPage Component={AnalyzePage} />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: PROTECTED_ROUTES.ANALYZE_TOPIC,
        element: <LazyPage Component={AnalyzePage} />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: PROTECTED_ROUTES.ANSWER_DETAIL,
        element: <LazyPage Component={AnswerDetailPage} />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: PROTECTED_ROUTES.ANALYZE_ANSWER_DETAIL,
        element: <LazyPage Component={AnswerDetailPage} />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: PROTECTED_ROUTES.WRITE,
        element: <LazyPage Component={WritePage} />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: PROTECTED_ROUTES.FREE_INSIGHT,
        element: <LazyPage Component={FreeInsightPage} />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: PROTECTED_ROUTES.TODAYS_QUESTION,
        element: <LazyPage Component={TodaysQuestionPage} />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: PROTECTED_ROUTES.ADMIN,
        element: (
          <RequireAuth requiredRole="ADMIN">
            <LazyPage Component={AdminPage} />
          </RequireAuth>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: PROTECTED_ROUTES.ADMIN_TODAYS_QUESTION,
        element: (
          <RequireAuth requiredRole="ADMIN">
            <LazyPage Component={TodaysQuestionAdmin} />
          </RequireAuth>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: PROTECTED_ROUTES.ADMIN_ANALYZE_WORLD,
        element: (
          <RequireAuth requiredRole="ADMIN">
            <LazyPage Component={AnalyzeWorldAdmin} />
          </RequireAuth>
        ),
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: PROTECTED_ROUTES.USER_HOME,
        element: <Navigate to={PROTECTED_ROUTES.USER_QUESTIONS} replace />,
      },
      {
        path: PROTECTED_ROUTES.USER_QUESTIONS,
        element: <LazyPage Component={MyQuestionsPage} />,
        errorElement: <RouteErrorBoundary />,
      },
      
      // Deprecated routes - redirect to new paths
      {
        path: DEPRECATED_ROUTES.MY_QUESTIONS,
        element: <Navigate to={PROTECTED_ROUTES.USER_QUESTIONS} replace />,
      },
      {
        path: DEPRECATED_ROUTES.MY_QUESTIONS_DETAIL,
        element: <Navigate to={PROTECTED_ROUTES.USER_QUESTIONS} replace />,
      },
    ],
  },

  // Coming soon routes
  ...Object.entries(COMING_SOON_ROUTES).map(([_, path]) => ({
    path,
    element: <ComingSoon message={COMING_SOON_MESSAGES[path as keyof typeof COMING_SOON_MESSAGES]} />,
    errorElement: <RouteErrorBoundary />,
  })),

  // Development routes
  {
    path: DEV_ROUTES.E2E_FLOW,
    element: <LazyPage Component={E2EFlow} />,
    errorElement: <RouteErrorBoundary />,
  },

  // Catch all - 404
  {
    path: '*',
    element: <RouteErrorBoundary />,
  },
]);