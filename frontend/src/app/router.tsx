import { createBrowserRouter, Navigate } from 'react-router-dom'
import HomePage from '@/pages/HomePage/Homepage'
import ProfilePage from '@/pages/Profile/ProfilePage'
import WritingHubPage from '@/pages/WritingHub/WritingHubPage'
import DefinePage from '@/pages/Define/DefinePage'
import DefineTopicPage from '@/pages/DefineTopic/DefineTopicPage'
import WritePage from '@/pages/Write/WritePage'
import QuestionDetail from '@/pages/Questions/Detail'
import E2EFlow from '@/pages/Dev/E2EFlow'
import RequireAuth from '@/shared/router/RequireAuth'
import MyQuestions from '@/pages/Questions/MyQuestions'
import RouteErrorBoundary from '@/app/RouteErrorBoundary'
import MyQuestionsPage from '@/pages/MyQuestions/MyQuestionsPage'
import RegisterPage from '@/pages/Auth/RegisterPage'
import ForgotPasswordPage from '@/pages/ForgotPassword/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPassword/ResetPasswordPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/sign-up',
    element: <RegisterPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/',
    element: <RequireAuth />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: 'profile', element: <ProfilePage />, errorElement: <RouteErrorBoundary /> },
      { path: 'writinghub', element: <WritingHubPage />, errorElement: <RouteErrorBoundary /> },
      { path: 'define', element: <DefinePage />, errorElement: <RouteErrorBoundary /> },
      { path: 'define/:slug', element: <DefinePage />, errorElement: <RouteErrorBoundary /> },
      { path: 'write', element: <WritePage />, errorElement: <RouteErrorBoundary /> },
      { path: 'users/me', element: <Navigate to="/users/me/questions" replace /> },
      { path: 'users/me/questions', element: <MyQuestionsPage />, errorElement: <RouteErrorBoundary /> },
      { path: 'my-questions', element: <Navigate to="/users/me/questions" replace /> },
      { path: 'my-questions/:id', element: <Navigate to="/users/me/questions" replace /> },
    ],
  },
  { path: '/metaphor', element: <div className="p-8">9월 중 공개 예정입니다</div> },
  { path: '/analyze', element: <div className="p-8">9월 중 공개 예정입니다</div> },
  { path: '/free-insight', element: <div className="p-8">9월 중 공개 예정입니다</div> },
  { path: '/todays-question', element: <div className="p-8">9월 중 공개 예정입니다</div> },
  { path: '/recommended', element: <div className="p-8">추후 업데이트될 예정입니다</div> },
  { path: '/questions/:id', element: <QuestionDetail />, errorElement: <RouteErrorBoundary /> },
  { path: '/dev/e2e', element: <E2EFlow />, errorElement: <RouteErrorBoundary /> },
  { path: '*', element: <RouteErrorBoundary /> },
])
