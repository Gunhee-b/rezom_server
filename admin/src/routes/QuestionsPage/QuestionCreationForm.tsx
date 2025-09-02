import { useState } from 'react';
import { useAdminAuth } from '@/hooks';
import { api } from '@/api/client';
import { SingleSelect, type SingleSelectOption } from '@/components/SingleSelect';

type ConceptKeyword = {
  id: number;
  keyword: string;
  position: number;
  active: boolean;
};

type QuestionCreationFormProps = {
  conceptSlug: string;
  keywords: ConceptKeyword[];
  onSuccess: () => void;
  onError: (message: string) => void;
  onKeywordsUpdated: () => void;
};

export function QuestionCreationForm({
  conceptSlug,
  keywords,
  onSuccess,
  onError,
  onKeywordsUpdated
}: QuestionCreationFormProps) {
  const { accessToken, refresh } = useAdminAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    selectedKeyword: '',
    setDaily: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert keywords to SingleSelect options
  const keywordOptions: SingleSelectOption[] = keywords
    .filter(kw => kw.active)
    .map(kw => ({
      label: kw.keyword,
      value: kw.keyword,
    }));

  const handleCreateNewKeyword = async (label: string): Promise<void> => {
    try {
      // Add new keyword to the concept
      const newKeywords = [
        ...keywords.map(k => ({ 
          keyword: k.keyword, 
          position: k.position,
          active: k.active 
        })),
        {
          keyword: label,
          position: keywords.length + 1,
          active: true,
        }
      ];

      await api(`/define/concepts/${conceptSlug}/keywords`, {
        method: 'PUT',
        json: { items: newKeywords },
        withCredentials: true,
        withCsrf: true,
        accessToken: accessToken ?? undefined,
      });

      // Refresh keywords list
      onKeywordsUpdated();
    } catch (error: any) {
      if (error?.status === 401) {
        try {
          await refresh();
          await handleCreateNewKeyword(label);
          return;
        } catch {}
      }
      throw new Error(error?.message ?? 'Failed to create new keyword');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.selectedKeyword) {
      onError('모든 필수 필드를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      
      const questionData = {
        title: formData.title,
        content: formData.content,
        tags,
        conceptSlug,
        keywords: [formData.selectedKeyword], // Single keyword as required
        setDaily: formData.setDaily,
      };
      
      await api('/questions', {
        method: 'POST',
        json: questionData,
        withCredentials: true,
        withCsrf: true,
        accessToken: accessToken ?? undefined,
      });

      // Reset form
      setFormData({
        title: '',
        content: '',
        tags: '',
        selectedKeyword: '',
        setDaily: false,
      });

      onSuccess();
    } catch (error: any) {
      if (error?.status === 401) {
        try {
          await refresh();
          await handleSubmit(e);
          return;
        } catch {}
      }
      
      // Handle specific server validation errors
      if (error?.error?.message) {
        if (Array.isArray(error.error.message)) {
          onError(error.error.message.join(', '));
        } else if (typeof error.error.message === 'string') {
          onError(error.error.message);
        } else {
          onError('질문 생성에 실패했습니다.');
        }
      } else {
        onError(error?.message ?? '질문 생성에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.title.trim() && formData.content.trim() && formData.selectedKeyword;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">새 질문 생성</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            제목 *
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="질문 제목을 입력하세요"
            disabled={isSubmitting}
          />
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            내용 *
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="질문 내용을 자세히 설명해주세요"
            disabled={isSubmitting}
          />
        </div>

        {/* Single Keyword Selection */}
        <div>
          <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">
            키워드 *
          </label>
          <SingleSelect
            options={keywordOptions}
            value={formData.selectedKeyword}
            onChange={(value) => setFormData(prev => ({ ...prev, selectedKeyword: value }))}
            placeholder="키워드를 선택하거나 새로 생성하세요"
            onCreateNew={handleCreateNewKeyword}
            disabled={isSubmitting}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            정확히 하나의 키워드를 선택해야 합니다. 새 키워드를 입력하면 자동으로 개념에 추가됩니다.
          </p>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            태그
          </label>
          <input
            id="tags"
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="태그를 쉼표로 구분하여 입력"
            disabled={isSubmitting}
          />
        </div>

        {/* Set Daily */}
        <div className="flex items-center">
          <input
            id="setDaily"
            type="checkbox"
            checked={formData.setDaily}
            onChange={(e) => setFormData(prev => ({ ...prev, setDaily: e.target.checked }))}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            disabled={isSubmitting}
          />
          <label htmlFor="setDaily" className="ml-2 block text-sm text-gray-700">
            오늘의 질문으로 설정
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? '질문 생성 중...' : '질문 생성'}
        </button>
      </form>
    </div>
  );
}