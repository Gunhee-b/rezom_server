import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { setDailyQuestion, purgeCacheScope, updateTop5Questions } from '@/shared/api/admin'
import { getDailyQuestion, listMyQuestions, type Question } from '@/shared/api/questions'
import { getKeywords, type TopFiveKeyword } from '@/api/define'

export default function AdminPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null)
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'questions' | 'top5' | 'todays-question' | 'analyze-world'>('dashboard')
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Fetch current daily question
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['daily-question'],
    queryFn: getDailyQuestion,
  })

  // Fetch all questions for selection
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['admin-questions'],
    queryFn: listMyQuestions,
  })

  // Fetch current analyze-world top 5 questions
  const { data: currentTop5, isLoading: top5Loading } = useQuery({
    queryKey: ['concept-keywords', 'analyze-world'],
    queryFn: () => getKeywords('analyze-world'),
  })

  // Set daily question mutation
  const setDailyMutation = useMutation({
    mutationFn: setDailyQuestion,
    onSuccess: (data) => {
      if (data.ok) {
        queryClient.invalidateQueries({ queryKey: ['daily-question'] })
        setSelectedQuestionId(null)
      }
    },
  })

  // Update top 5 questions mutation
  const updateTop5Mutation = useMutation({
    mutationFn: (questionIds: number[]) => updateTop5Questions('analyze-world', questionIds),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['concept-keywords', 'analyze-world'] })
        setSelectedQuestions([])
      }
    },
  })

  // Purge cache mutation
  const purgeCacheMutation = useMutation({
    mutationFn: ({ scope, slug }: { scope: string; slug?: string }) => 
      purgeCacheScope(scope, slug),
  })

  // Initialize selected questions when current data loads for analyze-world
  useEffect(() => {
    if (currentTop5 && Array.isArray(currentTop5) && currentTop5.length > 0) {
      // Check if it's Top5 format
      const isTop5Format = currentTop5.length > 0 && 'rank' in currentTop5[0] && 'questionId' in currentTop5[0];
      
      if (isTop5Format) {
        const top5Data = currentTop5 as TopFiveKeyword[]
        const questionIds = top5Data
          .sort((a, b) => a.rank - b.rank)
          .map(item => item.questionId)
        setSelectedQuestions(questionIds)
      }
    }
  }, [currentTop5])

  const handleSetDailyQuestion = () => {
    if (selectedQuestionId) {
      setDailyMutation.mutate(selectedQuestionId)
    }
  }

  const handleQuestionToggle = (questionId: number) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId)
      } else if (prev.length < 5) {
        return [...prev, questionId]
      } else {
        // Replace the last question if already at limit
        return [...prev.slice(0, 4), questionId]
      }
    })
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null) return

    const newOrder = [...selectedQuestions]
    const draggedItem = newOrder[draggedIndex]
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(dropIndex, 0, draggedItem)
    
    setSelectedQuestions(newOrder)
    setDraggedIndex(null)
  }

  const handleUpdateTop5 = () => {
    if (selectedQuestions.length === 5) {
      updateTop5Mutation.mutate(selectedQuestions)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                ←
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Rezom Admin</h1>
            </div>
            <nav className="flex space-x-6">
              <button
                onClick={() => setSelectedTab('dashboard')}
                className={`text-sm ${selectedTab === 'dashboard' ? 'text-purple-600 underline' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setSelectedTab('questions')}
                className={`text-sm ${selectedTab === 'questions' ? 'text-purple-600 underline' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Questions
              </button>
              <button
                onClick={() => setSelectedTab('todays-question')}
                className={`text-sm ${selectedTab === 'todays-question' ? 'text-purple-600 underline' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Today's Question
              </button>
              <button
                onClick={() => setSelectedTab('analyze-world')}
                className={`text-sm ${selectedTab === 'analyze-world' ? 'text-purple-600 underline' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Analyze World
              </button>
              <button
                onClick={() => setSelectedTab('top5')}
                className={`text-sm ${selectedTab === 'top5' ? 'text-purple-600 underline' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Top-5
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h2>
          <div className="bg-white border rounded-lg p-6">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-2xl font-bold">{questions?.length || 0}</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{dailyData?.question ? 1 : 0}</div>
                <div className="text-sm text-gray-600">Today's Question</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{(currentTop5 as TopFiveKeyword[])?.length || 0}</div>
                <div className="text-sm text-gray-600">Top-5 Questions</div>
              </div>
            </div>
          </div>
        </div>


        {/* Content Area */}
        <div className="mb-8">
          <div className="bg-white border rounded-lg">

            {/* Tab Content */}
            <div className="p-6">
              {selectedTab === 'dashboard' && (
                <div>
                  <h3 className="text-lg font-medium mb-6">System Overview</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b">
                      <span>Today's Question</span>
                      <span>{dailyData?.question ? 'Set' : 'Not Set'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span>Analyze World Top-5</span>
                      <span>{(currentTop5 as TopFiveKeyword[])?.length || 0}/5 configured</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span>Total Questions</span>
                      <span>{questions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span>System Status</span>
                      <span>Online</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === 'questions' && (
                <div>
                  <div className="mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">All Questions</span>
                      <span className="text-sm font-medium text-gray-900">
                        {questions?.length || 0} questions
                      </span>
                    </div>
                  </div>

                  {questions && questions.length > 0 ? (
                    <div className="space-y-3">
                      {questions.map((question: Question) => (
                        <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{question.title}</div>
                              <div className="text-sm text-gray-600 mt-1">{question.body}</div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>#{question.id}</span>
                                <span>{new Date(question.createdAt || '').toLocaleDateString()}</span>
                                {question.tags && (
                                  <div className="flex gap-1">
                                    {question.tags.map((tag: string) => (
                                      <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-gray-600">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {(dailyData?.question as any)?.id === question.id && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Daily
                                </span>
                              )}
                              {selectedQuestions.includes(question.id) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Top-5
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No questions available. Please create some questions first.</p>
                    </div>
                  )}
                </div>
              )}

              {selectedTab === 'top5' && (
                <div>
                  <div className="mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Top 5 Questions Management</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(currentTop5 as TopFiveKeyword[])?.length || 0}/5 questions
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(currentTop5 as TopFiveKeyword[])?.length > 0 ? (
                      (currentTop5 as TopFiveKeyword[])
                        .sort((a, b) => a.rank - b.rank)
                        .map((item, index) => (
                          <div key={item.questionId} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full text-sm font-bold">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-purple-900">{item.label}</h3>
                                <p className="text-sm text-purple-700 mt-1">Question ID: {item.questionId}</p>
                                <div className="text-xs text-purple-600 mt-2">
                                  Question ID: {item.questionId} | Rank: {item.rank}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-amber-700">No top 5 questions are currently configured.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTab === 'todays-question' && (
                <div>
                  {/* Current Daily Question */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Today's Question</h3>
                    {dailyData?.question ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm font-medium text-green-800">Active</span>
                        </div>
                        <h4 className="font-semibold text-green-900 mb-2">{(dailyData.question as any)?.title || 'Daily Question'}</h4>
                        <p className="text-sm text-green-700">{(dailyData.question as any)?.body || 'Question content'}</p>
                        <div className="mt-2 text-xs text-green-600">
                          Question ID: {(dailyData.question as any)?.id || 'N/A'}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                          <span className="text-sm font-medium text-amber-800">No Question Set</span>
                        </div>
                        <p className="text-sm text-amber-700">No daily question is currently set. Please select a question from the list below.</p>
                      </div>
                    )}
                  </div>

                  {/* Question Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Select Today's Question</h3>
                      {setDailyMutation.isPending && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm">Updating...</span>
                        </div>
                      )}
                    </div>

                    {questions && questions.length > 0 ? (
                      <div className="space-y-3">
                        {questions.map((question: Question) => (
                          <div
                            key={question.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedQuestionId === question.id
                                ? 'border-blue-500 bg-blue-50'
                                : (dailyData?.question as any)?.id === question.id
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedQuestionId(question.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <input
                                    type="radio"
                                    checked={selectedQuestionId === question.id}
                                    onChange={() => setSelectedQuestionId(question.id)}
                                    className="w-4 h-4 text-blue-600"
                                  />
                                  <h4 className="font-medium text-gray-900">{question.title}</h4>
                                  {(dailyData?.question as any)?.id === question.id && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 ml-6">{question.body}</p>
                                <div className="text-xs text-gray-400 ml-6 mt-1">
                                  ID: {question.id} | Created: {new Date(question.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No questions available. Please create some questions first.</p>
                      </div>
                    )}

                    {/* Actions */}
                    {selectedQuestionId && (
                      <div className="mt-6 flex items-center gap-4">
                        <button
                          onClick={handleSetDailyQuestion}
                          disabled={setDailyMutation.isPending || selectedQuestionId === (dailyData?.question as any)?.id}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {setDailyMutation.isPending ? 'Setting...' : 'Set as Today\'s Question'}
                        </button>
                        <button
                          onClick={() => setSelectedQuestionId(null)}
                          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Success/Error Messages */}
                    {setDailyMutation.isSuccess && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 text-sm">✅ Today's question has been updated successfully!</p>
                      </div>
                    )}
                    {setDailyMutation.isError && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">❌ Failed to update today's question. Please try again.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTab === 'analyze-world' && (
                <div>
                  {/* Current Top 5 Questions */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Top 5 Questions</h3>
                    {(currentTop5 as TopFiveKeyword[])?.length > 0 ? (
                      <div className="space-y-3">
                        {(currentTop5 as TopFiveKeyword[])
                          .sort((a, b) => a.rank - b.rank)
                          .map((item, index) => (
                            <div key={item.questionId} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-blue-900">{item.label}</h4>
                                  <p className="text-sm text-blue-700 mt-1">Question ID: {item.questionId}</p>
                                  <div className="text-xs text-blue-600 mt-2">
                                    Question ID: {item.questionId} | Rank: {item.rank}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-amber-700">No questions are currently set for Analyzing the World.</p>
                      </div>
                    )}
                  </div>

                  {/* Question Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Select Top 5 Questions ({selectedQuestions.length}/5)
                      </h3>
                      {updateTop5Mutation.isPending && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm">Updating...</span>
                        </div>
                      )}
                    </div>

                    {/* Selected Questions (Draggable) */}
                    {selectedQuestions.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Questions (Drag to reorder):</h4>
                        <div className="space-y-2">
                          {selectedQuestions.map((questionId, index) => {
                            const question = questions?.find((q: Question) => q.id === questionId)
                            if (!question) return null

                            return (
                              <div
                                key={questionId}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, index)}
                                className="bg-green-50 border border-green-200 rounded-lg p-3 cursor-move hover:bg-green-100 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-sm font-bold">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-medium text-green-900">{question.title}</h5>
                                    <p className="text-sm text-green-700">{question.body}</p>
                                  </div>
                                  <button
                                    onClick={() => handleQuestionToggle(questionId)}
                                    className="text-red-600 hover:text-red-800 px-2 py-1 text-sm"
                                    title="Remove from selection"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Available Questions */}
                    {questions && questions.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">Available Questions:</h4>
                        {questions
                          .filter((question: Question) => !selectedQuestions.includes(question.id))
                          .map((question: Question) => (
                            <div
                              key={question.id}
                              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer transition-colors"
                              onClick={() => handleQuestionToggle(question.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-medium text-gray-900">{question.title}</h5>
                                    {selectedQuestions.length >= 5 && (
                                      <span className="text-xs text-amber-600">(Limit reached)</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">{question.body}</p>
                                  <div className="text-xs text-gray-400 mt-1">
                                    ID: {question.id} | Created: {new Date(question.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleQuestionToggle(question.id)
                                  }}
                                  disabled={selectedQuestions.length >= 5}
                                  className="ml-4 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {selectedQuestions.length >= 5 ? 'Full' : 'Add'}
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex items-center gap-4">
                      <button
                        onClick={handleUpdateTop5}
                        disabled={selectedQuestions.length !== 5 || updateTop5Mutation.isPending || !(() => {
                          const currentTop5Questions = currentTop5 as TopFiveKeyword[] || []
                          return JSON.stringify(selectedQuestions) !== JSON.stringify(
                            currentTop5Questions
                              .sort((a, b) => a.rank - b.rank)
                              .map(item => item.questionId)
                          )
                        })()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {updateTop5Mutation.isPending ? 'Updating...' : 'Update Top 5 Questions'}
                      </button>
                      <button
                        onClick={() => {
                          const currentTop5Questions = currentTop5 as TopFiveKeyword[] || []
                          const currentIds = currentTop5Questions
                            .sort((a, b) => a.rank - b.rank)
                            .map(item => item.questionId)
                          setSelectedQuestions(currentIds)
                        }}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Reset
                      </button>
                    </div>

                    {selectedQuestions.length !== 5 && (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-amber-800 text-sm">
                          Please select exactly 5 questions to update Analyzing the World.
                        </p>
                      </div>
                    )}

                    {/* Success/Error Messages */}
                    {updateTop5Mutation.isSuccess && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 text-sm">✅ Analyzing the World questions have been updated successfully!</p>
                      </div>
                    )}
                    {updateTop5Mutation.isError && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">❌ Failed to update questions. Please try again.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Actions */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">System Actions</h2>
          <div className="bg-white border rounded-lg p-6">
            <div className="flex justify-between items-center">
              <span>Cache Management</span>
              <button
                onClick={() => purgeCacheMutation.mutate({ scope: 'all' })}
                disabled={purgeCacheMutation.isPending}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                {purgeCacheMutation.isPending ? 'Clearing...' : 'Clear All Cache'}
              </button>
            </div>
            
            {purgeCacheMutation.isError && (
              <div className="mt-4 text-sm text-red-600">
                Failed to clear cache.
              </div>
            )}

            {purgeCacheMutation.isSuccess && (
              <div className="mt-4 text-sm text-green-600">
                Cache cleared successfully.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}