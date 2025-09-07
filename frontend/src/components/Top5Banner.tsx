import { useQuery } from '@tanstack/react-query';
import { getTop5Questions, type TopFiveQuestion } from '@/api/define';

interface Top5BannerProps {
  conceptSlug: string;
  title: string;
  onQuestionClick?: (questionId: number) => void;
}

export function Top5Banner({ conceptSlug, title, onQuestionClick }: Top5BannerProps) {
  const { data: top5Questions, isLoading } = useQuery({
    queryKey: ['top5-questions', conceptSlug],
    queryFn: () => getTop5Questions(conceptSlug),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Top 5 {title} Questions</h2>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!top5Questions || top5Questions.length === 0) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Top 5 {title} Questions</h2>
            <p className="text-sm text-gray-500">No questions available yet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Top 5 {title} Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {top5Questions.map((question, index) => (
            <div
              key={question.questionId}
              onClick={() => onQuestionClick?.(question.questionId)}
              className={`
                p-3 rounded-lg border transition-all duration-200
                ${onQuestionClick 
                  ? 'cursor-pointer hover:bg-white hover:shadow-md hover:border-blue-300' 
                  : ''
                }
                bg-white/70 border-gray-200
              `}
            >
              <div className="flex items-start space-x-2">
                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-500 rounded-full flex-shrink-0">
                  {question.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                    {question.title}
                  </h3>
                  {question.content && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {question.content}
                    </p>
                  )}
                  {question.tags && question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {question.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {question.tags.length > 2 && (
                        <span className="text-xs text-gray-400">+{question.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}