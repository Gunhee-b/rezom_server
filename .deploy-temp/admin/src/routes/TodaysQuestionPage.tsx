import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useAdminAuth } from '@/hooks';

export function TodaysQuestionPage() {
  const { accessToken } = useAdminAuth();
  const [todaysQuestion, setTodaysQuestion] = useState<any>(null);
  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load current today's question
      const todayResponse = await fetch('http://localhost:3000/daily/question', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (todayResponse.ok) {
        const data = await todayResponse.json();
        setTodaysQuestion(data.question);
        setSelectedQuestionId(data.question?.id || '');
      }

      // Load all questions for selection (from all categories)
      const questionsResponse = await fetch('http://localhost:3000/questions', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (questionsResponse.ok) {
        const questions = await questionsResponse.json();
        setAllQuestions(questions || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadData();
    }
  }, [accessToken]);

  const updateTodaysQuestion = async () => {
    if (!selectedQuestionId || !accessToken) return;
    
    setSaving(true);
    try {
      const response = await fetch('http://localhost:3000/daily/question', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          questionId: parseInt(selectedQuestionId)
        })
      });
      
      if (response.ok) {
        await loadData(); // Reload data
        alert('Today\'s question updated successfully!');
      } else {
        const errorData = await response.json();
        alert('Failed to update today\'s question: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to update:', error);
      alert('Error updating today\'s question');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Today's Question Management">
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            {/* Current Today's Question */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Current Today's Question</h3>
              {todaysQuestion ? (
                <div className="space-y-3">
                  <div>
                    <strong>Question ID:</strong> {todaysQuestion.id}
                  </div>
                  <div>
                    <strong>Title:</strong> {todaysQuestion.title}
                  </div>
                  <div>
                    <strong>Content:</strong> {todaysQuestion.body}
                  </div>
                  <div>
                    <strong>Category ID:</strong> {todaysQuestion.categoryId}
                  </div>
                  <div className="text-sm text-gray-600">
                    Created: {new Date(todaysQuestion.createdAt).toLocaleString()}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No question set for today</p>
              )}
            </div>

            {/* Set New Today's Question */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Set New Today's Question</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Question
                  </label>
                  <select
                    value={selectedQuestionId}
                    onChange={(e) => setSelectedQuestionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a question...</option>
                    {allQuestions.map((q: any) => (
                      <option key={q.id} value={q.id}>
                        [Cat:{q.categoryId}] ID:{q.id} - {q.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedQuestionId && (
                  <div className="p-4 bg-gray-50 rounded-md">
                    {(() => {
                      const selected = allQuestions.find((q: any) => q.id.toString() === selectedQuestionId);
                      return selected ? (
                        <div>
                          <strong>Preview:</strong>
                          <p className="text-sm text-gray-600 mt-1">Category ID: {selected.categoryId}</p>
                          <p className="mt-2">{selected.body || selected.content}</p>
                          {selected.tags && selected.tags.length > 0 && (
                            <div className="mt-2">
                              <span className="text-sm text-gray-600">Tags: </span>
                              {selected.tags.map((tag: string, idx: number) => (
                                <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                <button
                  onClick={updateTodaysQuestion}
                  disabled={!selectedQuestionId || saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  {saving ? 'Updating...' : 'Set as Today\'s Question'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}