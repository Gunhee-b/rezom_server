import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTop5Questions } from '@/shared/api/admin'
import { listMyQuestions, type Question } from '@/shared/api/questions'
import { getKeywords, type TopFiveKeyword } from '@/api/define'

export default function AnalyzeWorldAdmin() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Fetch current analyze-world top 5 questions
  const { data: currentTop5, isLoading: top5Loading } = useQuery({
    queryKey: ['concept-keywords', 'analyze-world'],
    queryFn: () => getKeywords('analyze-world'),
  })

  // Fetch available questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['my-questions'],
    queryFn: listMyQuestions,
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

  // Initialize selected questions when current data loads
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

  const currentTop5Questions = currentTop5 as TopFiveKeyword[] || []
  const hasChanges = JSON.stringify(selectedQuestions) !== JSON.stringify(
    currentTop5Questions
      .sort((a, b) => a.rank - b.rank)
      .map(item => item.questionId)
  )

  if (top5Loading || questionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-64"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Back to Admin</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Analyzing the World Management</h1>
          </div>
        </div>

        {/* Current Top 5 Questions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Top 5 Questions</h2>
          {currentTop5Questions.length > 0 ? (
            <div className="space-y-3">
              {currentTop5Questions
                .sort((a, b) => a.rank - b.rank)
                .map((item, index) => (
                  <div key={item.questionId} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900">{item.label}</h3>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Select Top 5 Questions ({selectedQuestions.length}/5)
            </h2>
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
              <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Questions (Drag to reorder):</h3>
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
                          <h4 className="font-medium text-green-900">{question.title}</h4>
                          <p className="text-sm text-green-700">{question.body}</p>
                        </div>
                        <button
                          onClick={() => handleQuestionToggle(questionId)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Remove from selection"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
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
              <h3 className="text-sm font-medium text-gray-700">Available Questions:</h3>
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
                          <h3 className="font-medium text-gray-900">{question.title}</h3>
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
              disabled={selectedQuestions.length !== 5 || updateTop5Mutation.isPending || !hasChanges}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updateTop5Mutation.isPending ? 'Updating...' : 'Update Top 5 Questions'}
            </button>
            <button
              onClick={() => {
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
    </div>
  )
}