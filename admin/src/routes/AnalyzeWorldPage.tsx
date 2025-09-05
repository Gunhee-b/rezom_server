import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useAdminAuth } from '@/hooks';

export function AnalyzeWorldPage() {
  const { accessToken } = useAdminAuth();
  const [analyzeQuestions, setAnalyzeQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: '', body: '', keywords: '' });

  const loadAnalyzeQuestions = async () => {
    setLoading(true);
    try {
      // Load questions from the analyze-world category (categoryId: 4)
      const response = await fetch('http://localhost:3000/questions?categoryId=4', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setAnalyzeQuestions(data || []);
    } catch (error) {
      console.error('Failed to load analyze questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadAnalyzeQuestions();
    }
  }, [accessToken]);

  const createAnalyzeQuestion = async () => {
    if (!newQuestion.title || !newQuestion.body) return;
    if (!accessToken) {
      alert('Please log in to create questions');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3000/questions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newQuestion.title,
          content: newQuestion.body,
          conceptSlug: 'social-analysis', // Analyze world questions use social-analysis category
          keywords: newQuestion.keywords.split(',').map(k => k.trim()).filter(k => k),
          tags: ['analyze-world']
        })
      });
      
      if (response.ok) {
        setNewQuestion({ title: '', body: '', keywords: '' });
        setShowCreateForm(false);
        loadAnalyzeQuestions();
        alert('Analyze question created successfully!');
      } else {
        console.error('Failed to create question:', response.status);
        alert('Failed to create question');
      }
    } catch (error) {
      console.error('Failed to create question:', error);
      alert('Error creating question');
    }
  };

  const deleteQuestion = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const response = await fetch(`http://localhost:3000/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        loadAnalyzeQuestions();
        alert('Question deleted successfully!');
      } else {
        alert('Failed to delete question');
      }
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert('Error deleting question');
    }
  };

  return (
    <AdminLayout title="Analyze the World Questions">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">
              Manage questions for the "Analyze the World" feature - questions that help users analyze social, political, and cultural topics.
            </p>
          </div>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            {showCreateForm ? 'Cancel' : 'Create Question'}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Create New Analyze Question</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Question title (e.g., 'Social Media Impact on Democracy')"
                value={newQuestion.title}
                onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <textarea
                placeholder="Question content (detailed question for analysis)"
                value={newQuestion.body}
                onChange={(e) => setNewQuestion({...newQuestion, body: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Keywords (comma separated, e.g., 'politics, society, analysis')"
                value={newQuestion.keywords}
                onChange={(e) => setNewQuestion({...newQuestion, keywords: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex space-x-3">
                <button 
                  onClick={createAnalyzeQuestion} 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Save Question
                </button>
                <button 
                  onClick={() => setShowCreateForm(false)} 
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-medium">Analyze Questions ({analyzeQuestions.length})</h2>
          </div>
          <div className="divide-y">
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-500">Loading questions...</div>
            ) : analyzeQuestions.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">No analyze questions found</div>
            ) : (
              analyzeQuestions.map((q: any) => (
                <div key={q.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">{q.title}</h3>
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                          ID: {q.id}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{q.body || q.content}</p>
                      {q.keywords && q.keywords.length > 0 && (
                        <div className="mb-2">
                          {q.keywords.map((keyword: string, idx: number) => (
                            <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Created: {new Date(q.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => deleteQuestion(q.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 text-sm rounded-md transition-colors"
                      >
                        Delete
                      </button>
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