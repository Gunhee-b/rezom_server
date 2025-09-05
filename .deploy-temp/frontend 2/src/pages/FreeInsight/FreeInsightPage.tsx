import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createInsight } from '@/api/insights';
import { useAuth } from '@/hooks/useAuth';

export default function FreeInsightPage() {
  const navigate = useNavigate();
  const { accessToken, isAuthed } = useAuth();
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<{ topic?: string; title?: string; body?: string }>({});

  const createInsightMutation = useMutation({
    mutationFn: () => {
      if (!accessToken) {
        throw new Error('로그인이 필요합니다.');
      }
      return createInsight({ topic, title, body }, accessToken);
    },
    onSuccess: () => {
      // Navigate to user profile page after successful creation
      navigate('/users/me');
    },
    onError: (error: any) => {
      console.error('Insight creation error:', error);
    },
  });

  const validateForm = () => {
    const newErrors: { topic?: string; title?: string; body?: string } = {};

    if (!topic.trim()) {
      newErrors.topic = '주제를 입력해주세요.';
    } else if (topic.length > 100) {
      newErrors.topic = '주제는 100자를 초과할 수 없습니다.';
    }

    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    } else if (title.length > 200) {
      newErrors.title = '제목은 200자를 초과할 수 없습니다.';
    }

    if (!body.trim()) {
      newErrors.body = '내용을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthed) {
      alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }

    if (!validateForm()) {
      return;
    }

    createInsightMutation.mutate();
  };

  const handleCancel = () => {
    navigate('/users/me');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-6">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">자유로운 통찰</h1>
          <p className="mt-2 text-gray-600">
            주제에 관계없이 자유롭게 생각을 작성해보세요.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          {/* Topic Field */}
          <div className="mb-6">
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
              주제 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (errors.topic) setErrors({ ...errors, topic: undefined });
              }}
              placeholder="예: 프로그래밍, 일상, 철학..."
              className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.topic ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={100}
            />
            {errors.topic && (
              <p className="mt-1 text-sm text-red-600">{errors.topic}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {topic.length}/100
            </p>
          </div>

          {/* Title Field */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: undefined });
              }}
              placeholder="통찰의 제목을 입력하세요"
              className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={200}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {title.length}/200
            </p>
          </div>

          {/* Body Field */}
          <div className="mb-6">
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (errors.body) setErrors({ ...errors, body: undefined });
              }}
              placeholder="자유롭게 생각을 작성해보세요..."
              rows={12}
              className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 resize-none ${
                errors.body ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.body && (
              <p className="mt-1 text-sm text-red-600">{errors.body}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {body.length}자
            </p>
          </div>

          {/* Error Message */}
          {createInsightMutation.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">
                작성 중 오류가 발생했습니다: {createInsightMutation.error.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createInsightMutation.isPending}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {createInsightMutation.isPending ? '저장 중...' : '작성 완료'}
            </button>
          </div>
        </form>

        {/* Guidelines */}
        <div className="mt-8 p-6 bg-emerald-50 rounded-lg">
          <h2 className="text-lg font-semibold text-emerald-900 mb-3">작성 가이드</h2>
          <ul className="space-y-2 text-sm text-emerald-800">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>주제는 자유롭게 선택하세요 - 전문 분야부터 일상까지 모든 것이 가능합니다</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>명확하고 구체적인 제목을 작성하면 나중에 찾기 쉽습니다</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>충분한 맥락과 세부사항을 포함하여 의미 있는 내용을 작성하세요</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>작성한 내용은 프로필 페이지에서 언제든지 확인하고 수정할 수 있습니다</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}