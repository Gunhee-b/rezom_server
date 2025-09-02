import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks';
import { api } from '@/api/client';
import { AdminLayout } from '@/components/AdminLayout';

type Keyword = {
  id: number;
  keyword: string;
  position: number;
  active: boolean;
  questionCount?: number;
};

export function KeywordsPage() {
  const { accessToken, refresh } = useAdminAuth();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('language-definition');
  const [newKeyword, setNewKeyword] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const categories = [
    { value: 'language-definition', label: 'Language Definition' },
    { value: 'description', label: 'Description' },
    { value: 'social-analysis', label: 'Social Analysis' },
  ];

  useEffect(() => {
    loadKeywords();
  }, [selectedCategory]);

  const loadKeywords = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await api<Keyword[]>(`/define/concepts/${selectedCategory}/keywords`, {
        withCredentials: true,
      });
      
      // Transform the data to match our interface
      const transformedKeywords = data.map((item: any) => ({
        id: item.id,
        keyword: item.keyword,
        position: item.position,
        active: item.active,
        questionCount: 0, // This would come from a separate API call if needed
      })).sort((a, b) => a.position - b.position);
      
      setKeywords(transformedKeywords);
      setHasChanges(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Failed to load keywords' });
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    
    const activeCount = keywords.filter(k => k.active).length;
    if (activeCount >= 5) {
      setMessage({ type: 'error', text: 'Maximum 5 active keywords allowed' });
      return;
    }

    const newKw: Keyword = {
      id: Date.now(),
      keyword: newKeyword.trim(),
      position: keywords.length + 1,
      active: true,
      questionCount: 0,
    };

    setKeywords([...keywords, newKw]);
    setNewKeyword('');
    setHasChanges(true);
    setMessage(null);
  };

  const toggleActive = (id: number) => {
    const keyword = keywords.find(k => k.id === id);
    if (!keyword) return;

    if (!keyword.active) {
      const activeCount = keywords.filter(k => k.active).length;
      if (activeCount >= 5) {
        setMessage({ type: 'error', text: 'Maximum 5 active keywords allowed' });
        return;
      }
    }

    setKeywords(keywords.map(k => 
      k.id === id ? { ...k, active: !k.active } : k
    ));
    setHasChanges(true);
    setMessage(null);
  };

  const moveKeyword = (id: number, direction: 'up' | 'down') => {
    const index = keywords.findIndex(k => k.id === id);
    if (index === -1) return;
    
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === keywords.length - 1) return;

    const newKeywords = [...keywords];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newKeywords[index], newKeywords[targetIndex]] = [newKeywords[targetIndex], newKeywords[index]];
    
    // Update positions
    newKeywords.forEach((k, i) => k.position = i + 1);
    
    setKeywords(newKeywords);
    setHasChanges(true);
  };

  const removeKeyword = (id: number) => {
    setKeywords(keywords.filter(k => k.id !== id));
    setHasChanges(true);
  };

  const saveKeywords = async () => {
    setLoading(true);
    try {
      // Prepare top 5 active keywords for API
      const topKeywords = keywords
        .filter(k => k.active)
        .slice(0, 5)
        .map((k, index) => ({
          keyword: k.keyword,
          position: index + 1,
          active: true,
        }));

      await api(`/define/concepts/${selectedCategory}/keywords`, {
        method: 'PUT',
        json: { items: topKeywords },
        withCredentials: true,
        withCsrf: true,
        accessToken: accessToken ?? undefined,
      });
      
      setMessage({ type: 'success', text: 'Keywords saved successfully (Top 5 active keywords)' });
      setHasChanges(false);
      await loadKeywords();
    } catch (error: any) {
      if (error?.status === 401) {
        try {
          await refresh();
          await saveKeywords();
          return;
        } catch {}
      }
      setMessage({ type: 'error', text: error?.message || 'Failed to save keywords' });
    } finally {
      setLoading(false);
    }
  };

  const activeKeywords = keywords.filter(k => k.active);
  const inactiveKeywords = keywords.filter(k => !k.active);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Keywords Management</h1>
            <p className="text-gray-600 mt-1">Manage concept keywords and positions</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            {hasChanges && (
              <button
                onClick={saveKeywords}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>Save Changes</span>
              </button>
            )}
          </div>
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

        {/* Add Keyword */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Keyword</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              placeholder="Enter keyword name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={addKeyword}
              disabled={!newKeyword.trim()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Keyword
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Note: Only the first 5 active keywords will be saved as primary concept keywords.
          </p>
        </div>

        {/* Active Keywords */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Active Keywords ({activeKeywords.length}/5)
            </h2>
          </div>
          <div className="p-6">
            {activeKeywords.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No active keywords</p>
            ) : (
              <div className="space-y-3">
                {activeKeywords.map((keyword, index) => (
                  <div
                    key={keyword.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      index < 5 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index < 5 ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{keyword.keyword}</p>
                        {keyword.questionCount !== undefined && (
                          <p className="text-sm text-gray-500">{keyword.questionCount} questions</p>
                        )}
                      </div>
                      {index < 5 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => moveKeyword(keyword.id, 'up')}
                        disabled={index === 0}
                        className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveKeyword(keyword.id, 'down')}
                        disabled={index === activeKeywords.length - 1}
                        className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => toggleActive(keyword.id)}
                        className="px-3 py-1 text-sm text-orange-600 hover:text-orange-800 font-medium"
                      >
                        Deactivate
                      </button>
                      <button
                        onClick={() => removeKeyword(keyword.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inactive Keywords */}
        {inactiveKeywords.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Inactive Keywords ({inactiveKeywords.length})
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {inactiveKeywords.map((keyword) => (
                  <div
                    key={keyword.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-600">
                        -
                      </div>
                      <div>
                        <p className="font-medium text-gray-600 line-through">{keyword.keyword}</p>
                        {keyword.questionCount !== undefined && (
                          <p className="text-sm text-gray-400">{keyword.questionCount} questions</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleActive(keyword.id)}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Activate
                      </button>
                      <button
                        onClick={() => removeKeyword(keyword.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}