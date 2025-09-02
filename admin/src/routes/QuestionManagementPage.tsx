import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks';
import { api } from '@/api/client';
import { TopFiveManager } from './TopFivePage/TopFiveManager';

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

export function QuestionManagementPage() {
  const { accessToken, refresh } = useAdminAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [keywords, setKeywords] = useState<ConceptKeyword[]>([]);
  const categories: Category[] = [
    { id: 1, name: 'Language Definition', slug: 'language-definition' },
    { id: 2, name: 'Description', slug: 'description' },
    { id: 3, name: 'Social Analysis', slug: 'social-analysis' }
  ];
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    body: '',
    tags: '',
    isDaily: false,
    keywords: '',
    setDaily: false,
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<'questions' | 'keywords' | 'top5'>('questions');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const getCurrentCategorySlug = () => {
    return categories.find(cat => cat.id === selectedCategory)?.slug || 'language-definition';
  };

  const loadQuestions = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const data = await api<Question[]>('/questions', {
        query: { categoryId: selectedCategory },
        withCredentials: true,
      });
      setQuestions(data);
    } catch (e: any) {
      setMsg(e?.message ?? 'Failed to load questions');
    } finally {
      setBusy(false);
    }
  };

  const loadKeywords = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const slug = getCurrentCategorySlug();
      const data = await api<ConceptKeyword[]>(`/define/concepts/${slug}/keywords`, {
        withCredentials: true,
      });
      setKeywords(data.sort((a, b) => a.position - b.position));
    } catch (e: any) {
      setMsg(e?.message ?? 'Failed to load keywords');
    } finally {
      setBusy(false);
    }
  };

  const updateKeywords = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const slug = getCurrentCategorySlug();
      // Filter and limit to first 5 keywords for the API
      const topKeywords = keywords
        .filter(k => k.active)
        .slice(0, 5)
        .map((k, index) => ({ 
          keyword: k.keyword, 
          position: index + 1,  // Ensure positions are 1-5
          active: true 
        }));

      if (topKeywords.length === 0) {
        setMsg('⚠️ Please add at least one active keyword');
        setBusy(false);
        return;
      }

      await api(`/define/concepts/${slug}/keywords`, {
        method: 'PUT',
        json: { items: topKeywords },
        withCredentials: true,
        withCsrf: true,
        accessToken: accessToken ?? undefined,
      });
      setMsg('Keywords updated successfully ✅ (Top 5 active keywords saved)');
      await loadKeywords();
    } catch (e: any) {
      if (e?.status === 401) {
        try {
          await refresh();
          await updateKeywords();
          return;
        } catch {}
      }
      setMsg(e?.message ?? 'Failed to update keywords');
    } finally {
      setBusy(false);
    }
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    
    // Check if we already have 5 active keywords
    const activeKeywords = keywords.filter(k => k.active);
    if (activeKeywords.length >= 5) {
      setMsg('⚠️ Maximum 5 active keywords allowed. Please deactivate one before adding new.');
      return;
    }
    
    const newPosition = keywords.length + 1;
    setKeywords([...keywords, {
      id: -1,
      conceptId: 1,
      keyword: newKeyword.trim(),
      position: newPosition,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }]);
    setNewKeyword('');
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const moveKeywordUp = (index: number) => {
    if (index === 0) return;
    const newKeywords = [...keywords];
    [newKeywords[index - 1], newKeywords[index]] = [newKeywords[index], newKeywords[index - 1]];
    newKeywords.forEach((k, i) => k.position = i + 1);
    setKeywords(newKeywords);
  };

  const moveKeywordDown = (index: number) => {
    if (index === keywords.length - 1) return;
    const newKeywords = [...keywords];
    [newKeywords[index], newKeywords[index + 1]] = [newKeywords[index + 1], newKeywords[index]];
    newKeywords.forEach((k, i) => k.position = i + 1);
    setKeywords(newKeywords);
  };

  const toggleKeywordActive = (index: number) => {
    const newKeywords = [...keywords];
    newKeywords[index].active = !newKeywords[index].active;
    setKeywords(newKeywords);
  };

  const createQuestion = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const tags = newQuestion.tags.split(',').map(t => t.trim()).filter(Boolean);
      const keywordsList = newQuestion.keywords.split(',').map(k => k.trim()).filter(Boolean);
      const conceptSlug = getCurrentCategorySlug();
      
      const questionData = {
        title: newQuestion.title,
        content: newQuestion.body, // Use 'content' for new API
        tags,
        conceptSlug, // Add concept slug for linking
        keywords: keywordsList, // Add keywords array
        setDaily: newQuestion.setDaily, // Use setDaily flag
      };
      
      await api('/questions', {
        method: 'POST',
        json: questionData,
        withCredentials: true,
        withCsrf: true,
        accessToken: accessToken ?? undefined,
      });

      setMsg('Question created successfully ✅ (with live update)');
      setNewQuestion({ title: '', body: '', tags: '', isDaily: false, keywords: '', setDaily: false });
      await loadQuestions();
      await loadKeywords(); // Reload keywords since new ones might have been added
    } catch (e: any) {
      if (e?.status === 401) {
        try {
          await refresh();
          await createQuestion();
          return;
        } catch {}
      }
      setMsg(e?.message ?? 'Failed to create question');
    } finally {
      setBusy(false);
    }
  };

  const setDailyQuestion = async (questionId: number) => {
    setBusy(true);
    setMsg(null);
    try {
      await api('/questions/daily', {
        method: 'PUT',
        json: { questionId },
        withCredentials: true,
        withCsrf: true,
        accessToken: accessToken ?? undefined,
      });
      setMsg('Daily question updated ✅');
      await loadQuestions();
    } catch (e: any) {
      if (e?.status === 401) {
        try {
          await refresh();
          await setDailyQuestion(questionId);
          return;
        } catch {}
      }
      setMsg(e?.message ?? 'Failed to set daily question');
    } finally {
      setBusy(false);
    }
  };

  const deleteQuestion = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    setBusy(true);
    setMsg(null);
    try {
      await api(`/questions/${questionId}`, {
        method: 'DELETE',
        withCredentials: true,
        withCsrf: true,
        accessToken: accessToken ?? undefined,
      });
      setMsg('Question deleted successfully ✅');
      await loadQuestions();
    } catch (e: any) {
      if (e?.status === 401) {
        try {
          await refresh();
          await deleteQuestion(questionId);
          return;
        } catch {}
      }
      setMsg(e?.message ?? 'Failed to delete question');
    } finally {
      setBusy(false);
    }
  };

  const purgeCache = async () => {
    if (!confirm('Are you sure you want to purge the cache for this concept?')) return;
    
    setBusy(true);
    setMsg(null);
    try {
      const slug = getCurrentCategorySlug();
      await api('/admin/cache/purge', {
        method: 'POST',
        json: { scope: 'define', slug },
        withCredentials: true,
        withCsrf: true,
        accessToken: accessToken ?? undefined,
      });
      setMsg('Cache purged successfully ✅');
    } catch (e: any) {
      if (e?.status === 401) {
        try {
          await refresh();
          await purgeCache();
          return;
        } catch {}
      }
      setMsg(e?.message ?? 'Failed to purge cache');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadQuestions();
    loadKeywords();
  }, [selectedCategory]);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Question & Keyword Management</h1>
      
      <div className="mb-6 flex gap-2">
        <select 
          className="border rounded px-3 py-2" 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(Number(e.target.value))}
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <button 
          className="bg-black text-white rounded px-4 py-2" 
          onClick={() => {
            loadQuestions();
            loadKeywords();
          }}
          disabled={busy}
        >
          Reload
        </button>
        <button 
          className="bg-red-600 text-white rounded px-4 py-2" 
          onClick={purgeCache}
          disabled={busy}
        >
          Purge Cache
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b">
        <nav className="flex gap-4">
          <button
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'questions' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('questions')}
          >
            Questions
          </button>
          <button
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'keywords' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('keywords')}
          >
            Keywords
          </button>
          <button
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'top5' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('top5')}
          >
            Top-5 Questions
          </button>
        </nav>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded ${msg.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {msg}
        </div>
      )}

      {activeTab === 'questions' && (
        <>
          <div className="mb-6 p-4 border rounded bg-gray-50">
            <h2 className="text-lg font-semibold mb-3">Create New Question</h2>
            <div className="space-y-3">
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Question title"
                value={newQuestion.title}
                onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
              />
              <textarea
                className="w-full border rounded px-3 py-2"
                placeholder="Question body"
                rows={4}
                value={newQuestion.body}
                onChange={(e) => setNewQuestion({...newQuestion, body: e.target.value})}
              />
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Tags (comma separated)"
                value={newQuestion.tags}
                onChange={(e) => setNewQuestion({...newQuestion, tags: e.target.value})}
              />
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Associated keywords (comma separated, will be linked to concept)"
                value={newQuestion.keywords}
                onChange={(e) => setNewQuestion({...newQuestion, keywords: e.target.value})}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newQuestion.setDaily}
                  onChange={(e) => setNewQuestion({...newQuestion, setDaily: e.target.checked})}
                />
                <span>Set as daily question (new setDaily API)</span>
              </label>
              <button
                className="bg-green-600 text-white rounded px-4 py-2"
                onClick={createQuestion}
                disabled={busy || !newQuestion.title || !newQuestion.body}
              >
                Create Question
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {questions.map((question) => (
              <div key={question.id} className="border rounded p-4 bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{question.title}</h3>
                    {question.isDaily && (
                      <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded mt-1">
                        Daily Question
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      onClick={() => setDailyQuestion(question.id)}
                      disabled={busy}
                    >
                      Set Daily
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800 text-sm"
                      onClick={() => deleteQuestion(question.id)}
                      disabled={busy}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 mb-2">{question.body}</p>
                {question.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {question.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  Created: {new Date(question.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {questions.length === 0 && !busy && (
              <div className="text-gray-500 text-center py-8">No questions found</div>
            )}
          </div>
        </>
      )}

      {activeTab === 'keywords' && (
        <>
          <div className="mb-4 flex gap-2">
            <input
              className="border rounded px-3 py-2 flex-1"
              placeholder="Enter new keyword"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            />
            <button
              className="bg-green-600 text-white rounded px-4 py-2"
              onClick={addKeyword}
              disabled={!newKeyword.trim()}
            >
              Add Keyword
            </button>
          </div>

          <div className="space-y-2 mb-6">
            {keywords.map((keyword, index) => {
              const activeIndex = keywords.slice(0, index + 1).filter(k => k.active).length;
              const isTop5 = keyword.active && activeIndex <= 5;
              
              return (
                <div
                  key={keyword.id}
                  className={`flex items-center gap-3 p-3 border rounded ${
                    isTop5 ? 'bg-blue-50 border-blue-300' : 
                    keyword.active ? 'bg-white' : 'bg-gray-100'
                  }`}
                >
                  <span className="text-gray-500 w-8">#{index + 1}</span>
                  {isTop5 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Top {activeIndex}
                    </span>
                  )}
                  <span className={`flex-1 font-medium ${!keyword.active ? 'line-through opacity-50' : ''}`}>
                    {keyword.keyword}
                  </span>
                  <button
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    onClick={() => toggleKeywordActive(index)}
                  >
                    {keyword.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className="text-gray-600 hover:text-gray-800"
                    onClick={() => moveKeywordUp(index)}
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    className="text-gray-600 hover:text-gray-800"
                    onClick={() => moveKeywordDown(index)}
                    disabled={index === keywords.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800 text-sm"
                    onClick={() => removeKeyword(index)}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          {keywords.length > 0 && (
            <div className="space-y-2">
              <button
                className="bg-blue-600 text-white rounded px-6 py-2"
                onClick={updateKeywords}
                disabled={busy}
              >
                {busy ? 'Updating...' : 'Save Top 5 Keywords'}
              </button>
              <p className="text-sm text-gray-600">
                Note: Only the first 5 active keywords will be saved as concept keywords (positions 1-5).
                Keywords from questions are managed separately.
              </p>
            </div>
          )}

          {keywords.length === 0 && !busy && (
            <div className="text-gray-500 text-center py-8">No keywords found</div>
          )}
        </>
      )}

      {activeTab === 'top5' && (
        <TopFiveManager
          conceptSlug={getCurrentCategorySlug()}
          onSuccess={(message) => setMsg(`✅ ${message}`)}
          onError={(message) => setMsg(message)}
        />
      )}
    </main>
  );
}