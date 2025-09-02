import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks';
import { api } from '@/api/client';
import { AdminLayout } from '@/components/AdminLayout';

type Question = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  isDaily: boolean;
  createdAt: string;
  keywords?: string[];
};

export function QuestionsPage() {
  const { accessToken, refresh } = useAdminAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('language-definition');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    body: '',
    tags: '',
    keywords: '',
    setDaily: false,
  });

  const categories = [
    { value: 'language-definition', label: 'Language Definition', id: 1 },
    { value: 'description', label: 'Description', id: 2 },
    { value: 'social-analysis', label: 'Social Analysis', id: 3 },
  ];

  useEffect(() => {
    loadQuestions();
  }, [selectedCategory]);

  const loadQuestions = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const categoryId = categories.find(c => c.value === selectedCategory)?.id;
      const data = await api<Question[]>('/questions', {
        query: { categoryId },
        withCredentials: true,
      });
      setQuestions(data || []);
    } catch (error: any) {
      console.error('Failed to load questions:', error);
      setMessage({ type: 'error', text: error?.message || 'Failed to load questions' });
    } finally {
      setLoading(false);
    }
  };

  const createQuestion = async () => {
    setMessage(null);
    try {
      if (!accessToken) {
        setMessage({ type: 'error', text: 'Please login first' });
        return;
      }

      const tags = newQuestion.tags.split(',').map(t => t.trim()).filter(Boolean);
      const keywords = newQuestion.keywords.split(',').map(k => k.trim()).filter(Boolean);
      
      // Validate exactly one keyword is provided
      if (keywords.length !== 1) {
        setMessage({ type: 'error', text: 'Exactly one keyword is required for a question.' });
        return;
      }
      
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
        console.log('🔄 After refresh, CSRF token:', newCsrfToken ? 'Found' : 'Still missing');
      }

      await api('/questions', {
        method: 'POST',
        json: {
          title: newQuestion.title,
          content: newQuestion.body,
          tags,
          conceptSlug: selectedCategory,
          keywords,
          setDaily: newQuestion.setDaily,
        },
        withCredentials: true,
        withCsrf: true,
        accessToken: accessToken ?? undefined,
      });
      
      setMessage({ type: 'success', text: 'Question created successfully' });
      setShowCreateModal(false);
      setNewQuestion({ title: '', body: '', tags: '', keywords: '', setDaily: false });
      await loadQuestions();
    } catch (error: any) {
      console.error('Failed to create question. Full error:', error);
      console.error('Error status:', error?.status);
      console.error('Error body:', error?.body);
      
      if (error?.status === 401) {
        console.log('Attempting token refresh...');
        try {
          await refresh();
          console.log('Token refreshed, retrying question creation...');
          await createQuestion();
          return;
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          setMessage({ type: 'error', text: 'Session expired. Please login again.' });
          return;
        }
      }
      
      setMessage({ type: 'error', text: error?.message || 'Failed to create question' });
    }
  };

  const setDailyQuestion = async (questionId: number) => {
    setMessage(null);
    try {
      await api('/questions/daily', {
        method: 'PUT',
        json: { questionId },
        withCredentials: true,
        withCsrf: true,
        accessToken: accessToken ?? undefined,
      });
      setMessage({ type: 'success', text: 'Daily question updated' });
      await loadQuestions();
    } catch (error: any) {
      console.error('Failed to set daily question:', error);
      setMessage({ type: 'error', text: error?.message || 'Failed to set daily question' });
    }
  };

  const deleteQuestion = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    setMessage(null);
    try {
      await api(`/questions/${questionId}`, {
        method: 'DELETE',
        withCredentials: true,
        withCsrf: true,
        accessToken: accessToken ?? undefined,
      });
      setMessage({ type: 'success', text: 'Question deleted successfully' });
      await loadQuestions();
    } catch (error: any) {
      console.error('Failed to delete question:', error);
      setMessage({ type: 'error', text: error?.message || 'Failed to delete question' });
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Questions Management</h1>
            <p className="text-gray-600 mt-1">Manage questions and daily selections</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <span>Create Question</span>
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <button
              onClick={loadQuestions}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Questions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keywords
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredQuestions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm font-medium text-gray-900">{question.title}</p>
                        <p className="text-sm text-gray-500 truncate mt-1">{question.body}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {question.keywords?.map((keyword, i) => (
                          <span key={i} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {question.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {question.isDaily ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                          Daily
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          Regular
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(question.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        {!question.isDaily && (
                          <button
                            onClick={() => setDailyQuestion(question.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Set Daily
                          </button>
                        )}
                        <button
                          onClick={() => deleteQuestion(question.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">No questions found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Question Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New Question</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter question title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                <textarea
                  value={newQuestion.body}
                  onChange={(e) => setNewQuestion({...newQuestion, body: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter question body..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                <input
                  type="text"
                  value={newQuestion.keywords}
                  onChange={(e) => setNewQuestion({...newQuestion, keywords: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter keywords (comma separated)..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={newQuestion.tags}
                  onChange={(e) => setNewQuestion({...newQuestion, tags: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter tags (comma separated)..."
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="setDaily"
                  checked={newQuestion.setDaily}
                  onChange={(e) => setNewQuestion({...newQuestion, setDaily: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="setDaily" className="ml-2 text-sm text-gray-700">
                  Set as daily question
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createQuestion}
                disabled={!newQuestion.title || !newQuestion.body}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Question
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}