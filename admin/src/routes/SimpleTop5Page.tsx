import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '@/hooks';

export function SimpleTop5Page() {
  const { accessToken } = useAdminAuth();
  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [category, setCategory] = useState('language-definition');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const categories = [
    { value: 'language-definition', label: 'Language Definition' },
    { value: 'description', label: 'Description' },
    { value: 'social-analysis', label: 'Social Analysis' }
  ];

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const categoryId = category === 'language-definition' ? '1' : '2';
      const response = await fetch(`https://api.rezom.org/questions?categoryId=${categoryId}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      const questions = await response.json();
      setAllQuestions(questions || []);

      try {
        const top5Response = await fetch(`https://api.rezom.org/define/${category}/top5`, {
          credentials: 'include'
        });
        if (top5Response.ok) {
          const top5Data = await top5Response.json();
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
        }
      } catch (error) {
        console.log('No existing top5 data');
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
  }, [category, accessToken]);

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

  const getCsrfToken = () => {
    const name = 'X-CSRF-Token';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
  };

  const saveTop5 = async () => {
    setSaving(true);
    try {
      const questionIds = selectedQuestions.map(q => q.id);
      const csrfToken = getCsrfToken();
      
      // Try different payload formats for the working endpoint
      const payloads = [
        { questionIds },
        { questionIds, conceptSlug: category },
        { questions: questionIds },
        { items: questionIds },
        questionIds,
        selectedQuestions.map((q, index) => ({ questionId: q.id, rank: index + 1 }))
      ];

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      };
      
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      let success = false;
      
      for (const payload of payloads) {
        try {
          console.log('Trying payload:', payload);
          
          const response = await fetch(`https://api.rezom.org/admin/define/${category}/top5`, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(payload)
          });
          
          if (response.ok) {
            console.log('Success with payload:', payload);
            success = true;
            break;
          } else {
            console.log(`Failed with payload:`, payload, 'Status:', response.status);
            const errorText = await response.text().catch(() => '');
            console.log('Error response:', errorText);
          }
        } catch (error) {
          console.log('Error with payload:', payload, error);
        }
      }

      if (success) {
        alert('Top-5 questions updated successfully!');
        await loadQuestions();
      } else {
        alert('Failed to save Top-5: The API endpoint exists but expects a different data format. Check the console for details.');
      }

    } catch (error) {
      console.error('Failed to save:', error);
      alert(`Failed to save Top-5 questions: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">← Back to Dashboard</Link>
              <h1 className="text-xl font-semibold">Top-5 Questions Manager</h1>
            </div>
            <button 
              onClick={saveTop5}
              disabled={saving || selectedQuestions.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update Top-5'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>Current Top-5:</strong> Questions with IDs {selectedQuestions.map(q => q.id).join(', ')} 
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Working endpoint found: POST /admin/define/{category}/top5 (testing different data formats)
          </p>
        </div>

        <div className="mb-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-medium">Available Questions</h2>
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
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
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
              <h2 className="text-lg font-medium">Top-5 Questions ({selectedQuestions.length}/5)</h2>
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
                      className="p-3 border border-blue-200 bg-blue-50 rounded flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                            {index + 1}
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
    </div>
  );
}
