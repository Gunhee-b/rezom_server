// src/pages/DefineTopic/DefineTopicPage.tsx
import { useMemo, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MindmapCanvas } from '@/widgets/mindmap/MindmapCanvas'
import { makeDefineSchema, type ConceptKeyword, type KeywordQuestion } from './makeDefineSchema'
import { QuestionDetailPanel } from '@/components/QuestionDetailPanel'
import { getKeywords } from '@/api/define'
import { useConceptUpdates } from '@/hooks/useConceptUpdates'
import { LiveUpdateStatus } from '@/components/LiveUpdateStatus'

// API function to fetch question by ID
async function fetchQuestion(questionId: number): Promise<KeywordQuestion> {
  const baseUrl = import.meta.env.VITE_API_URL || 'https://api.rezom.org';
  const response = await fetch(`${baseUrl}/questions/${questionId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch question: ${response.statusText}`);
  }
  return response.json();
}

export default function DefineTopicPage() {
  const { slug = 'language-definition' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  
  // ----- State for question detail panel -----
  const [selectedKeyword, setSelectedKeyword] = useState<{
    keyword: string;
    questionId: number | null;
  } | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<KeywordQuestion | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  
  // ----- Live Updates State -----
  const [liveUpdateCount, setLiveUpdateCount] = useState(0)
  const [lastUpdateMessage, setLastUpdateMessage] = useState<string | null>(null)

  // ----- Fetch Keywords (Top-5 admin-curated list) -----
  const { data: keywords = [], isLoading: keywordsLoading, refetch: refetchKeywords } = useQuery({
    queryKey: ['define', 'keywords', slug],
    queryFn: () => getKeywords(slug),
  })

  // ----- Fetch selected question when a keyword is clicked -----
  const { data: questionDetail, refetch: refetchQuestion } = useQuery<KeywordQuestion | null>({
    queryKey: ['question', selectedKeyword?.questionId],
    queryFn: () => selectedKeyword?.questionId ? fetchQuestion(selectedKeyword.questionId) : null,
    enabled: !!selectedKeyword?.questionId,
  })

  // ----- Generate the new define schema -----
  const schema = useMemo(() => {
    // Filter to only ConceptKeyword format for makeDefineSchema
    const conceptKeywords = Array.isArray(keywords) && keywords.length > 0 && 'id' in keywords[0] 
      ? keywords as ConceptKeyword[] 
      : [];
    return makeDefineSchema(slug, conceptKeywords, questionDetail || undefined);
  }, [slug, keywords, questionDetail])

  // ----- Handle node clicks -----
  const handleNodeClick = useCallback((nodeId: string, nodeData?: any) => {
    console.log('Node clicked:', nodeId, nodeData);
    
    // Only handle keyword node clicks
    if (nodeId.includes('keyword-')) {
      const keywordId = nodeData?.['data-keyword-id'];
      const questionId = nodeData?.['data-question-id'];
      
      if (keywordId) {
        const conceptKeywords = Array.isArray(keywords) && keywords.length > 0 && 'id' in keywords[0] ? keywords as ConceptKeyword[] : [];
        const keyword = conceptKeywords.find(k => k.id.toString() === keywordId);
        if (keyword) {
          setSelectedKeyword({
            keyword: keyword.keyword,
            questionId: questionId ? parseInt(questionId) : null,
          });
          setPanelOpen(true);
          
          // If there's a question, it will be fetched automatically by the query
          if (questionId) {
            refetchQuestion();
          }
        }
      }
    }
  }, [keywords, refetchQuestion])

  // ----- Handle write button in question panel -----
  const handleWriteClick = useCallback((questionId: number) => {
    navigate(`/write?questionId=${questionId}`);
  }, [navigate])

  // ----- Handle panel close -----
  const handlePanelClose = useCallback(() => {
    setPanelOpen(false);
    setSelectedKeyword(null);
    setSelectedQuestion(null);
  }, [])

  // ----- Live Updates via SSE -----
  const handleLiveUpdate = useCallback(() => {
    setLiveUpdateCount(prev => prev + 1)
    setLastUpdateMessage(`Keywords updated at ${new Date().toLocaleTimeString()}`)
    
    // Refetch keywords when live update received
    refetchKeywords()
    
    // Clear message after 3 seconds
    setTimeout(() => setLastUpdateMessage(null), 3000)
  }, [refetchKeywords])

  const { isConnected, error: sseError } = useConceptUpdates(slug, {
    enabled: false, // TEMPORARILY DISABLED to prevent network spam
    onUpdate: handleLiveUpdate,
    onError: (error) => {
      console.warn('SSE connection error:', error)
    },
  })

  if (keywordsLoading) {
    return (
      <main className="min-h-screen bg-neutral-50 pt-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading definition graph...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50 pt-6">
      {/* Live Update Status */}
      <LiveUpdateStatus
        isConnected={isConnected}
        error={sseError}
        updateCount={liveUpdateCount}
        lastMessage={lastUpdateMessage}
      />

      {/* Header */}
      <div className="mx-auto max-w-4xl px-4 mb-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {slug.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')} Graph
          </h1>
          <p className="text-gray-600">
            Click any keyword node to see its associated question. The center represents the core definition.
          </p>
        </div>
      </div>

      {/* Define Graph */}
      <div className="mx-auto max-w-6xl px-4">
        <MindmapCanvas 
          schema={schema} 
          onNodeClick={handleNodeClick}
        />
      </div>

      {/* Keywords Summary */}
      <div className="mx-auto max-w-4xl px-4 mt-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Admin-Curated Keywords</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {keywords.slice(0, 5).map((keyword) => (
              <div
                key={keyword.id}
                className={`p-3 rounded-lg border text-center cursor-pointer transition-colors ${
                  keyword.currentQuestionId 
                    ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => handleNodeClick(`keyword-${keyword.id}`, {
                  'data-keyword-id': keyword.id.toString(),
                  'data-question-id': keyword.currentQuestionId?.toString() || '',
                })}
              >
                <div className="font-medium text-gray-900">{keyword.keyword}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {keyword.currentQuestionId ? 'Has Question' : 'No Question'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Question Detail Panel */}
      <QuestionDetailPanel
        question={questionDetail || null}
        keyword={selectedKeyword?.keyword || ''}
        isOpen={panelOpen}
        onClose={handlePanelClose}
        onWriteClick={handleWriteClick}
      />
    </main>
  )
}