import { useState } from 'react';
import { createQuestion, type CreateQuestionRequest } from '@/api/define';

interface EnhancedQuestionFormProps {
  conceptSlug?: string;
  onSuccess?: (question: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function EnhancedQuestionForm({ 
  conceptSlug, 
  onSuccess, 
  onError,
  className = '' 
}: EnhancedQuestionFormProps) {
  const [formData, setFormData] = useState<CreateQuestionRequest>({
    title: '',
    content: '',
    tags: [],
    keywords: [],
    conceptSlug: conceptSlug || '',
    setDaily: false,
  });
  
  const [tagsInput, setTagsInput] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content?.trim()) {
      onError?.('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const data: CreateQuestionRequest = {
        ...formData,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        keywords: keywordsInput.split(',').map(k => k.trim()).filter(Boolean),
      };

      const result = await createQuestion(data);
      onSuccess?.(result);
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        tags: [],
        keywords: [],
        conceptSlug: conceptSlug || '',
        setDaily: false,
      });
      setTagsInput('');
      setKeywordsInput('');
      
    } catch (error: any) {
      const message = error?.message || '질문 생성에 실패했습니다.';
      onError?.(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          질문 제목 *
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="질문 제목을 입력하세요"
          disabled={isSubmitting}
          required
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          질문 내용 *
        </label>
        <textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="질문 내용을 자세히 설명해주세요"
          disabled={isSubmitting}
          required
        />
      </div>

      <div>
        <label htmlFor="conceptSlug" className="block text-sm font-medium text-gray-700 mb-1">
          연결할 개념
        </label>
        <input
          id="conceptSlug"
          type="text"
          value={formData.conceptSlug}
          onChange={(e) => setFormData(prev => ({ ...prev, conceptSlug: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="예: language-definition"
          disabled={isSubmitting}
        />
        <p className="text-xs text-gray-500 mt-1">
          질문을 특정 개념에 연결하면 해당 페이지에서 실시간으로 업데이트됩니다.
        </p>
      </div>

      <div>
        <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
          관련 키워드
        </label>
        <input
          id="keywords"
          type="text"
          value={keywordsInput}
          onChange={(e) => setKeywordsInput(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="키워드를 쉼표로 구분하여 입력 (예: 혁신, 창의성, 목적)"
          disabled={isSubmitting}
        />
        <p className="text-xs text-gray-500 mt-1">
          새로운 키워드는 자동으로 개념에 추가됩니다.
        </p>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
          태그
        </label>
        <input
          id="tags"
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="태그를 쉼표로 구분하여 입력"
          disabled={isSubmitting}
        />
      </div>

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

      <button
        type="submit"
        disabled={isSubmitting || !formData.title.trim() || !formData.content?.trim()}
        className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? '질문 생성 중...' : '질문 생성'}
      </button>
    </form>
  );
}