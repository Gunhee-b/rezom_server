import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { setDailyQuestion } from '@/shared/api/admin'
import { getDailyQuestion, listMyQuestions, type Question } from '@/shared/api/questions'

export default function TodaysQuestionAdmin() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null)

  // Fetch current daily question
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['daily-question'],
    queryFn: getDailyQuestion,
  })

  // Fetch available questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['my-questions'],
    queryFn: listMyQuestions,
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

  const handleSetDailyQuestion = () => {
    if (selectedQuestionId) {
      setDailyMutation.mutate(selectedQuestionId)
    }
  }

  if (dailyLoading || questionsLoading) {
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
            <h1 className="text-2xl font-bold text-gray-900">Today's Question Management</h1>
          </div>
        </div>

        {/* Current Daily Question */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Today's Question</h2>
          {dailyData?.question ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">Active</span>
              </div>
              <h3 className="font-semibold text-green-900 mb-2">{dailyData.question.title}</h3>
              <p className="text-sm text-green-700">{dailyData.question.body}</p>
              <div className="mt-2 text-xs text-green-600">
                Question ID: {dailyData.question.id}
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Today's Question</h2>
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
                      : dailyData?.question?.id === question.id
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
                        <h3 className="font-medium text-gray-900">{question.title}</h3>
                        {dailyData?.question?.id === question.id && (
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
                disabled={setDailyMutation.isPending || selectedQuestionId === dailyData?.question?.id}
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
    </div>
  )
}