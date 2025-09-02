import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks';
import { api } from '@/api/client';

type Question = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  keywordLabel?: string;
};

type TopFiveManagerProps = {
  conceptSlug: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export function TopFiveManager({ conceptSlug, onSuccess, onError }: TopFiveManagerProps) {
  const { accessToken, refresh } = useAdminAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      // Get recent questions for this concept
      const data = await api<Question[]>(`/define/concepts/${conceptSlug}/questions`, {
        query: { limit: 20 },
        withCredentials: true,
      });
      setQuestions(data);
    } catch (error: any) {
      onError('질문을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentTop5 = async () => {
    try {
      const data = await api<Array<{
        questionId: number;
        title: string;
        content: string;
        keywordLabel: string | null;
        rank: number;
        tags: string[];
        createdAt: string;
      }>>(`/define/${conceptSlug}/top5`);
      
      // Convert to Question format and sort by rank
      const top5Questions = data
        .sort((a, b) => a.rank - b.rank)
        .map(item => ({
          id: item.questionId,
          title: item.title,
          body: item.content,
          tags: Array.isArray(item.tags) ? item.tags : [],
          createdAt: item.createdAt,
          keywordLabel: item.keywordLabel || undefined,
        }));
      
      setSelectedQuestions(top5Questions);
    } catch (error: any) {
      // It's OK if no Top-5 exists yet
      setSelectedQuestions([]);
    }
  };

  useEffect(() => {
    loadQuestions();
    loadCurrentTop5();
  }, [conceptSlug]);

  const toggleQuestionSelection = (question: Question) => {
    const isSelected = selectedQuestions.some(q => q.id === question.id);
    
    if (isSelected) {
      setSelectedQuestions(prev => prev.filter(q => q.id !== question.id));
    } else {
      if (selectedQuestions.length >= 5) {
        onError('최대 5개의 질문만 선택할 수 있습니다.');
        return;
      }
      setSelectedQuestions(prev => [...prev, question]);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newOrder = [...selectedQuestions];
    const draggedItem = newOrder[draggedIndex];
    
    // Remove dragged item
    newOrder.splice(draggedIndex, 1);
    
    // Insert at new position
    if (draggedIndex < dropIndex) {
      newOrder.splice(dropIndex - 1, 0, draggedItem);
    } else {
      newOrder.splice(dropIndex, 0, draggedItem);
    }
    
    setSelectedQuestions(newOrder);
    setDraggedIndex(null);
  };

  const moveQuestionUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...selectedQuestions];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setSelectedQuestions(newOrder);
  };

  const moveQuestionDown = (index: number) => {
    if (index === selectedQuestions.length - 1) return;
    const newOrder = [...selectedQuestions];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setSelectedQuestions(newOrder);
  };

  const saveTop5 = async () => {
    if (selectedQuestions.length === 0) {
      onError('최소 1개의 질문을 선택해주세요.');
      return;
    }

    setSaving(true);
    try {
      // Check for CSRF token before making request
      const readCookie = (name: string) => {
        if (typeof document === 'undefined') return undefined;
        const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
        return m ? decodeURIComponent(m[1]) : undefined;
      };
      
      const csrfToken = readCookie('X-CSRF-Token');
      
      if (!csrfToken) {
        console.warn('⚠️ No CSRF token found. Attempting refresh...');
        await refresh();
        const newCsrfToken = readCookie('X-CSRF-Token');
        if (!newCsrfToken) {
          onError('CSRF 토큰을 가져올 수 없습니다. 다시 로그인해주세요.');
          return;
        }
      }

      const questionIds = selectedQuestions.map(q => q.id);
      
      await api(`/admin/define/${conceptSlug}/top5`, {
        method: 'POST',
        json: { questionIds },
        withCredentials: true,
        withCsrf: true,
        accessToken: accessToken ?? undefined,
      });

      onSuccess('Top-5 질문이 성공적으로 저장되었습니다! (캐시 자동 갱신됨)');
    } catch (error: any) {
      if (error?.status === 401) {
        try {
          await refresh();
          await saveTop5();
          return;
        } catch (refreshError: any) {
          // If refresh fails, user needs to login again
          onError('세션이 만료되었습니다. 다시 로그인해주세요.');
          // Redirect to login page
          window.location.href = '/login';
          return;
        }
      }
      onError(error?.error || error?.message || 'Top-5 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Top-5 질문 관리</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Questions */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-800">사용 가능한 질문</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                질문이 없습니다
              </div>
            ) : (
              questions.map((question) => {
                const isSelected = selectedQuestions.some(q => q.id === question.id);
                return (
                  <div
                    key={question.id}
                    onClick={() => toggleQuestionSelection(question)}
                    className={`
                      p-3 border rounded-lg cursor-pointer transition-colors
                      ${isSelected 
                        ? 'border-emerald-300 bg-emerald-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                      {question.title}
                    </div>
                    {question.keywordLabel && (
                      <div className="text-xs text-emerald-600 mb-1">
                        키워드: {question.keywordLabel}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {new Date(question.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Questions (Drag to Order) */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-800">
            선택된 Top-5 질문 ({selectedQuestions.length}/5)
          </h3>
          
          {selectedQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              질문을 선택해주세요
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {selectedQuestions.map((question, index) => (
                <div
                  key={question.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`
                    p-3 border rounded-lg bg-white cursor-move transition-all
                    hover:shadow-md border-emerald-200
                    ${draggedIndex === index ? 'opacity-50' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm mb-1 truncate">
                        {question.title}
                      </div>
                      {question.keywordLabel && (
                        <div className="text-xs text-emerald-600">
                          키워드: {question.keywordLabel}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveQuestionUp(index);
                        }}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveQuestionDown(index);
                        }}
                        disabled={index === selectedQuestions.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedQuestions(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={saveTop5}
            disabled={saving || selectedQuestions.length === 0}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Top-5 저장 중...' : 'Top-5 저장'}
          </button>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        💡 드래그하여 순서를 변경하거나 화살표 버튼을 사용하세요. 저장하면 캐시가 자동으로 갱신됩니다.
      </div>
    </div>
  );
}