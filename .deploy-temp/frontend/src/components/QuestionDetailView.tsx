import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getQuestionDetail, getAnswers, createAnswer, type QuestionDetail, type Answer, type CreateAnswerRequest } from '@/api/define';
import { useAuth } from '@/hooks/useAuth';

interface QuestionDetailViewProps {
  slug: string;
  questionId: number;
  onClose: () => void;
}

export function QuestionDetailView({ slug, questionId, onClose }: QuestionDetailViewProps) {
  const queryClient = useQueryClient();
  const { accessToken, isAuthed } = useAuth();
  const navigate = useNavigate();
  const [answerTitle, setAnswerTitle] = useState('');
  const [answerBody, setAnswerBody] = useState('');
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  // Fetch question details
  const { data: question, isLoading: questionLoading, error: questionError } = useQuery<QuestionDetail>({
    queryKey: ['question-detail', slug, questionId],
    queryFn: () => getQuestionDetail(slug, questionId),
    enabled: !!slug && !!questionId,
  });

  // Fetch answers for this question
  const { data: answers = [], isLoading: answersLoading } = useQuery<Answer[]>({
    queryKey: ['question-answers', questionId],
    queryFn: () => getAnswers(questionId),
    enabled: !!questionId,
  });

  // Submit answer mutation
  const createAnswerMutation = useMutation({
    mutationFn: (data: CreateAnswerRequest) => {
      console.log('Submitting answer with auth:', { isAuthed, hasToken: !!accessToken });
      return createAnswer(data, accessToken || undefined);
    },
    onSuccess: () => {
      // Refresh answers list
      queryClient.invalidateQueries({ queryKey: ['question-answers', questionId] });
      // Clear form and hide it
      setAnswerTitle('');
      setAnswerBody('');
      setShowAnswerForm(false);
    },
    onError: (error: any) => {
      console.error('Answer submission error:', error);
    },
  });

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerBody.trim()) return;

    if (!isAuthed || !accessToken) {
      alert('로그인이 필요합니다.');
      return;
    }

    createAnswerMutation.mutate({
      questionId,
      title: answerTitle.trim() || undefined,
      body: answerBody.trim(),
    });
  };

  // Helper function to get first line of answer body
  const getFirstLine = (text: string) => {
    return text.split('\n')[0].substring(0, 100) + (text.length > 100 ? '...' : '');
  };

  // Helper function to get user's answer number
  const getUserAnswerNumber = (userId: number) => {
    const userAnswers = answers.filter(answer => answer.User.id === userId);
    const sortedUserAnswers = userAnswers.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return sortedUserAnswers.length;
  };

  // Helper function to get current answer number for a user
  const getCurrentAnswerNumber = (answerId: number, userId: number) => {
    const userAnswers = answers.filter(answer => answer.User.id === userId);
    const sortedUserAnswers = userAnswers.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return sortedUserAnswers.findIndex(answer => answer.id === answerId) + 1;
  };

  // Handle answer click to navigate to detail page
  const handleAnswerClick = (answerId: number) => {
    navigate(`/define/${slug}/questions/${questionId}/answers/${answerId}`);
  };


  if (questionLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (questionError || !question) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">오류</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600">질문을 불러올 수 없습니다.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{question.title}</h1>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        {/* Question Content */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {question.content}
          </p>
          
          {/* Question Meta */}
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            <span>생성일: {new Date(question.createdAt).toLocaleDateString('ko-KR')}</span>
            {question.keywordLabel && (
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">
                {question.keywordLabel}
              </span>
            )}
          </div>
        </div>

        {/* Answers Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              답변 ({answers.length})
            </h2>
            {!showAnswerForm && (
              <button
                onClick={() => setShowAnswerForm(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm"
              >
                답변 작성
              </button>
            )}
          </div>

          {/* Answer Form */}
          {showAnswerForm && (
            <form onSubmit={handleSubmitAnswer} className="bg-emerald-50 rounded-lg p-4 space-y-3">
              <input
                type="text"
                value={answerTitle}
                onChange={(e) => setAnswerTitle(e.target.value)}
                placeholder="답변 제목"
                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={createAnswerMutation.isPending}
              />
              <textarea
                value={answerBody}
                onChange={(e) => setAnswerBody(e.target.value)}
                placeholder="이 질문에 대한 답변을 작성해주세요..."
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                disabled={createAnswerMutation.isPending}
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!answerBody.trim() || createAnswerMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
                >
                  {createAnswerMutation.isPending ? '제출 중...' : '답변 제출'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAnswerForm(false);
                    setAnswerTitle('');
                    setAnswerBody('');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                >
                  취소
                </button>
              </div>
              {createAnswerMutation.error && (
                <p className="text-red-600 text-sm">
                  답변 제출에 실패했습니다: {createAnswerMutation.error.message}
                </p>
              )}
            </form>
          )}

          {/* Answers List */}
          {answersLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : answers.length > 0 ? (
            <div className="space-y-3">
              {answers.map((answer) => (
                <div 
                  key={answer.id} 
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:shadow-md transition-all"
                  onClick={() => handleAnswerClick(answer.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    {answer.title ? (
                      <h3 className="font-semibold text-gray-900">{answer.title}</h3>
                    ) : (
                      <h3 className="font-semibold text-gray-900">답변</h3>
                    )}
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                      #{getCurrentAnswerNumber(answer.id, answer.User.id)}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">
                    {getFirstLine(answer.body)}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span>{answer.User.email}</span>
                      <span className="text-xs text-gray-400">
                        ({getUserAnswerNumber(answer.User.id)}개 답변)
                      </span>
                    </div>
                    <span>{new Date(answer.createdAt).toLocaleString('ko-KR')}</span>
                  </div>
                  <div className="flex items-center justify-end mt-2">
                    <span className="text-xs text-gray-400">자세히 보기 →</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>아직 답변이 없습니다.</p>
              <p className="text-sm mt-1">첫 번째 답변을 작성해보세요!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
