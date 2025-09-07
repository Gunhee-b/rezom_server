import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useAdminAuth } from '@/hooks';
import { api } from '@/api/client';

export function AnalyzeWorldTop5Page() {
  const { accessToken } = useAdminAuth();
  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      // Load questions from the analyze-world category (categoryId: 4)
      const questions = await api('/questions', {
        query: { categoryId: '4' },
        accessToken
      });
      setAllQuestions(questions || []);

      // Load existing top5 for social-analysis (analyze world)
      try {
        const top5Data = await api('/define/social-analysis/top5');
        const formattedTop5 = top5Data.map(item => ({
          id: item.questionId,
          title: item.title,
          body: item.content,
          rank: item.rank,
          tags: item.tags,
          createdAt: item.createdAt,
          keywordLabel: item.keywordLabel
        })).sort((a, b) => a.rank - b.rank);
        setSelectedQuestions(formattedTop5);
      } catch (error) {
        console.log('No existing top5 data for social-analysis');
        setSelectedQuestions([]);
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadQuestions();
    }
  }, [accessToken]);

  const toggleQuestion = (question) => {
    const isSelected = selectedQuestions.some(q => q.id === question.id);
    
    if (isSelected) {
      setSelectedQuestions(prev => prev.filter(q => q.id !== question.id));
    } else {
      if (selectedQuestions.length < 5) {
        setSelectedQuestions(prev => [...prev, { 
          ...question, 
          rank: prev.length + 1,
          body: question.body || question.content 
        }]);
      }
    }
  };

  const moveQuestion = (fromIndex, toIndex) => {
    const newSelected = [...selectedQuestions];
    const [moved] = newSelected.splice(fromIndex, 1);
    newSelected.splice(toIndex, 0, moved);
    
    const reranked = newSelected.map((q, index) => ({ ...q, rank: index + 1 }));
    setSelectedQuestions(reranked);
  };

  const saveTop5 = async () => {
    setSaving(true);
    try {
      const questionIds = selectedQuestions.map(q => q.id);
      
      await api('/admin/define/social-analysis/top5', {
        method: 'POST',
        accessToken,
        json: { questionIds }
      });
      
      alert('Analyze World Top-5 questions updated successfully!');
      await loadQuestions();

    } catch (error) {
      console.error('Failed to save:', error);
      alert(`Failed to save Top-5 questions: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Analyze World Top-5 Manager">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analyze World Top-5</h1>
            <p className="text-gray-600 mt-1">
              Manage the top 5 questions for analyze world (social analysis) category
            </p>
          </div>
          <button 
            onClick={saveTop5}
            disabled={saving || selectedQuestions.length === 0}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            {saving ? 'Saving...' : 'Update Top-5'}
          </button>
        </div>

        <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded">
          <p className="text-sm text-purple-800">
            <strong>Current Analyze World Top-5:</strong> Questions with IDs {selectedQuestions.map(q => q.id).join(', ')} 
          </p>
          <p className="text-xs text-purple-600 mt-1">
            Endpoint: POST /admin/define/social-analysis/top5
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-medium">Available Analyze World Questions</h2>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading questions...</div>
              ) : allQuestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No questions found</div>
              ) : (
                <div className="space-y-2">
                  {allQuestions.map(question => {
                    const isSelected = selectedQuestions.some(q => q.id === question.id);
                    return (
                      <div
                        key={question.id}
                        onClick={() => !isSelected && selectedQuestions.length < 5 && toggleQuestion(question)}
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-green-300 bg-green-50' 
                            : selectedQuestions.length >= 5 
                              ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                      >
                        <h3 className="font-medium text-sm">ID: {question.id} - {question.title}</h3>
                        <p className="text-xs text-gray-600 mt-1">{question.body || question.content}</p>
                        {isSelected && <span className="text-xs text-green-600 mt-1 block">✓ Currently in Top-5</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-medium">Analyze World Top-5 ({selectedQuestions.length}/5)</h2>
            </div>
            <div className="p-4">
              {selectedQuestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded">
                  No Top-5 questions selected
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      className="p-3 border border-purple-200 bg-purple-50 rounded flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="bg-purple-500 text-white text-xs px-2 py-1 font-bold">
                            #{index + 1}
                          </span>
                          <div>
                            <h3 className="font-medium text-sm">ID: {question.id} - {question.title}</h3>
                            <p className="text-xs text-gray-600 mt-1">{question.body || question.content}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => index > 0 && moveQuestion(index, index - 1)}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button 
                          onClick={() => index < selectedQuestions.length - 1 && moveQuestion(index, index + 1)}
                          disabled={index === selectedQuestions.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button 
                          onClick={() => toggleQuestion(question)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}