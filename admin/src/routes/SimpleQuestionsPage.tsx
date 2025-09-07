import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useAdminAuth } from '@/hooks';
import { api } from '@/api/client';

export function SimpleQuestionsPage() {
  const { accessToken } = useAdminAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('language-definition');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: '', body: '', keywords: '' });

  const categories = [
    { id: '1', value: 'language-definition', label: 'Language Definition' },
    { id: '2', value: 'description', label: 'Description' },
    { id: '3', value: 'social-analysis', label: 'Social Analysis' }
  ];

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const categoryId = categories.find(c => c.value === category)?.id;
      const data = await api('/questions', {
        query: { categoryId },
        accessToken
      });
      setQuestions(data || []);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [category, accessToken]);

  const createQuestion = async () => {
    if (!newQuestion.title || !newQuestion.body) return;
    if (!accessToken) {
      alert('Please log in to create questions');
      return;
    }
    
    console.log('Creating question with token:', accessToken.substring(0, 20) + '...');
    
    try {
      await api('/questions', {
        method: 'POST',
        accessToken,
        json: {
          title: newQuestion.title,
          content: newQuestion.body,
          conceptSlug: category,
          keywords: newQuestion.keywords.split(',').map(k => k.trim()).filter(k => k),
          tags: []
        }
      });
      
      setNewQuestion({ title: '', body: '', keywords: '' });
      setShowCreateForm(false);
      loadQuestions();
    } catch (error) {
      console.error('Failed to create question:', error);
    }
  };

  return (
    <AdminLayout title="Questions Management">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            {showCreateForm ? 'Cancel' : 'Create Question'}
          </button>
        </div>
        {showCreateForm && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Create New Question</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Question title"
                value={newQuestion.title}
                onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
              <textarea
                placeholder="Question body"
                value={newQuestion.body}
                onChange={(e) => setNewQuestion({...newQuestion, body: e.target.value})}
                rows="3"
                className="w-full px-3 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Keywords (comma separated)"
                value={newQuestion.keywords}
                onChange={(e) => setNewQuestion({...newQuestion, keywords: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
              <div className="flex space-x-3">
                <button onClick={createQuestion} className="bg-green-600 text-white px-4 py-2 rounded">
                  Save
                </button>
                <button onClick={() => setShowCreateForm(false)} className="bg-gray-400 text-white px-4 py-2 rounded">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Questions</h2>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 border rounded"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-500">Loading questions...</div>
            ) : questions.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">No questions found</div>
            ) : (
              questions.map(q => (
                <div key={q.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium">{q.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{q.body}</p>
                      {q.keywords && q.keywords.length > 0 && (
                        <div className="mt-2">
                          {q.keywords.map((keyword, idx) => (
                            <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 ml-4">
                      {new Date(q.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
