import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks';
import { api } from '@/api/client';
import { QuestionCreationForm } from './QuestionCreationForm';
import { TopFiveManager } from '../TopFivePage/TopFiveManager';

type Category = {
  id: number;
  name: string;
  slug: string;
};

type ConceptKeyword = {
  id: number;
  conceptId: number;
  keyword: string;
  position: number;
  active: boolean;
  currentQuestionId?: number | null;
  createdAt: string;
  updatedAt: string;
};

type Question = {
  id: number;
  authorId: number;
  categoryId: number;
  title: string;
  body: string;
  tags: string[];
  isDaily: boolean;
  createdAt: string;
  updatedAt: string;
};

export function QuestionsPage() {
  const { accessToken, refresh } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'top5' | 'list'>('create');
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [keywords, setKeywords] = useState<ConceptKeyword[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const categories: Category[] = [
    { id: 1, name: 'Language Definition', slug: 'language-definition' },
    { id: 2, name: 'Description', slug: 'description' },
    { id: 3, name: 'Social Analysis', slug: 'social-analysis' }
  ];

  const getCurrentCategorySlug = () => {
    return categories.find(cat => cat.id === selectedCategory)?.slug || 'language-definition';
  };

  const loadKeywords = async () => {
    setLoading(true);
    try {
      const slug = getCurrentCategorySlug();
      const data = await api<ConceptKeyword[]>(`/define/concepts/${slug}/keywords`, {
        withCredentials: true,
      });
      setKeywords(data.sort((a, b) => a.position - b.position));
    } catch (error: any) {
      setMessage(`키워드를 불러오는데 실패했습니다: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await api<Question[]>('/questions', {
        query: { categoryId: selectedCategory },
        withCredentials: true,
      });
      setQuestions(data);
    } catch (error: any) {
      setMessage(`질문을 불러오는데 실패했습니다: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const purgeCache = async () => {
    if (!confirm('이 개념의 캐시를 삭제하시겠습니까?')) return;
    
    setLoading(true);
    try {
      const slug = getCurrentCategorySlug();
      await api('/admin/cache/purge', {
        method: 'POST',
        json: { scope: 'define', slug },
        withCredentials: true,
        withCsrf: true,
        accessToken: accessToken ?? undefined,
      });
      setMessage('캐시가 성공적으로 삭제되었습니다! ✅');
    } catch (error: any) {
      if (error?.status === 401) {
        try {
          await refresh();
          await purgeCache();
          return;
        } catch {}
      }
      setMessage(`캐시 삭제에 실패했습니다: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const setDailyQuestion = async (questionId: number) => {
    setLoading(true);
    try {
      await api('/questions/daily', {
        method: 'PUT',
        json: { questionId },
        withCredentials: true,
        withCsrf: true,
        accessToken: accessToken ?? undefined,
      });
      setMessage('오늘의 질문이 설정되었습니다! ✅');
      await loadQuestions();
    } catch (error: any) {
      if (error?.status === 401) {
        try {
          await refresh();
          await setDailyQuestion(questionId);
          return;
        } catch {}
      }
      setMessage(`오늘의 질문 설정에 실패했습니다: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (questionId: number) => {
    if (!confirm('이 질문을 삭제하시겠습니까?')) return;
    
    setLoading(true);
    try {
      await api(`/questions/${questionId}`, {
        method: 'DELETE',
        withCredentials: true,
        withCsrf: true,
        accessToken: accessToken ?? undefined,
      });
      setMessage('질문이 성공적으로 삭제되었습니다! ✅');
      await loadQuestions();
    } catch (error: any) {
      if (error?.status === 401) {
        try {
          await refresh();
          await deleteQuestion(questionId);
          return;
        } catch {}
      }
      setMessage(`질문 삭제에 실패했습니다: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (msg: string) => {
    setMessage(msg);
    loadQuestions();
    loadKeywords();
  };

  const handleError = (msg: string) => {
    setMessage(msg);
  };

  useEffect(() => {
    loadKeywords();
    loadQuestions();
  }, [selectedCategory]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <main className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-4">질문 관리</h1>
        
        {/* Category Selection & Cache Purge */}
        <div className="flex items-center gap-3 mb-6">
          <select 
            className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(Number(e.target.value))}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          
          <button 
            className="bg-gray-900 text-white rounded-md px-4 py-2 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50" 
            onClick={() => {
              loadQuestions();
              loadKeywords();
            }}
            disabled={loading}
          >
            새로고침
          </button>
          
          <button 
            className="bg-red-600 text-white rounded-md px-4 py-2 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50" 
            onClick={purgeCache}
            disabled={loading}
            title="현재 개념의 캐시 삭제"
          >
            캐시 삭제
          </button>
        </div>

        {/* Tab Navigation */}
        <nav className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 border-b-2 font-medium text-sm ${
              activeTab === 'create'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            질문 생성
          </button>
          <button
            onClick={() => setActiveTab('top5')}
            className={`px-6 py-3 border-b-2 font-medium text-sm ${
              activeTab === 'top5'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Top-5 관리
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            질문 목록
          </button>
        </nav>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('✅') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'create' && (
        <QuestionCreationForm
          conceptSlug={getCurrentCategorySlug()}
          keywords={keywords}
          onSuccess={() => handleSuccess('질문이 성공적으로 생성되었습니다! ✅')}
          onError={handleError}
          onKeywordsUpdated={loadKeywords}
        />
      )}

      {activeTab === 'top5' && (
        <TopFiveManager
          conceptSlug={getCurrentCategorySlug()}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}

      {activeTab === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">질문 목록</h2>
          
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium mb-2">질문이 없습니다</h3>
              <p className="text-sm">첫 번째 질문을 생성해보세요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">{question.title}</h3>
                      {question.isDaily && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          오늘의 질문
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setDailyQuestion(question.id)}
                        disabled={loading}
                        className="text-emerald-600 hover:text-emerald-800 text-sm font-medium disabled:opacity-50"
                      >
                        오늘의 질문으로
                      </button>
                      <button
                        onClick={() => deleteQuestion(question.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3 line-clamp-2">{question.body}</p>
                  
                  {question.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-3">
                      {question.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    생성일: {new Date(question.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}