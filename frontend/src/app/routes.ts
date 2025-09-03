import { RouteObject } from 'react-router-dom';

export const PUBLIC_ROUTES = {
  HOME: '/',
  SIGN_UP: '/sign-up',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  QUESTION_DETAIL: '/questions/:id',
} as const;

export const PROTECTED_ROUTES = {
  PROFILE: '/profile',
  WRITING_HUB: '/writinghub',
  DEFINE: '/define',
  DEFINE_TOPIC: '/define/:slug',
  ANSWER_DETAIL: '/define/:slug/questions/:questionId/answers/:answerId',
  WRITE: '/write',
  FREE_INSIGHT: '/free-insight',
  USER_HOME: '/users/me',
  USER_QUESTIONS: '/users/me/questions',
} as const;

export const COMING_SOON_ROUTES = {
  METAPHOR: '/metaphor',
  ANALYZE: '/analyze',
  TODAYS_QUESTION: '/todays-question',
  RECOMMENDED: '/recommended',
} as const;

export const DEV_ROUTES = {
  E2E_FLOW: '/dev/e2e',
} as const;

export const DEPRECATED_ROUTES = {
  MY_QUESTIONS: '/my-questions',
  MY_QUESTIONS_DETAIL: '/my-questions/:id',
} as const;

export const COMING_SOON_MESSAGES = {
  [COMING_SOON_ROUTES.METAPHOR]: '9월 중 공개 예정입니다',
  [COMING_SOON_ROUTES.ANALYZE]: '9월 중 공개 예정입니다',
  [COMING_SOON_ROUTES.TODAYS_QUESTION]: '9월 중 공개 예정입니다',
  [COMING_SOON_ROUTES.RECOMMENDED]: '추후 업데이트될 예정입니다',
} as const;