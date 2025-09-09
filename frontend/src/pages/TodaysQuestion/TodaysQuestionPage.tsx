import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDailyQuestion } from '@/shared/api/questions'
import { MindmapCanvas } from '@/widgets/mindmap/MindmapCanvas'
import { QuestionDetailView } from '@/components/QuestionDetailView'

// Schema for today's question mindmap - similar to define schema but simpler
const todaysQuestionSchema = {
  nodes: [
    {
      id: 'todays:title',
      x: 50,
      y: 48,
      label: 'Today\'s Question',
      size: 'md' as const,
    }
  ],
  edges: [] as any[],
  backgroundColor: '#F3F4F6',
};

export default function TodaysQuestionPage() {
  const navigate = useNavigate();
  const [showQuestionDetail, setShowQuestionDetail] = useState(false);
  
  // Fetch today's question
  const { data: dailyData, isLoading } = useQuery({
    queryKey: ['daily-question'],
    queryFn: getDailyQuestion,
  });

  // Transform data into mindmap schema
  const schema = useMemo(() => {
    const s = JSON.parse(JSON.stringify(todaysQuestionSchema));

    if (dailyData?.question) {
      // Add the question node
      const questionNode = {
        id: 'todays:question',
        x: 50,
        y: 70,
        label: (dailyData.question as any)?.title.length > 30 
          ? `${(dailyData.question as any)?.title.substring(0, 30)}...` 
          : (dailyData.question as any)?.title,
        size: 'sm' as const,
        questionId: (dailyData.question as any)?.id,
      };

      s.nodes.push(questionNode);

      // Add edge from center to question
      s.edges.push({
        id: 'todays:edge-1',
        from: 'todays:title',
        to: 'todays:question',
        style: 'green' as const,
        curvature: 0.1
      });
    }

    return s;
  }, [dailyData]);

  // Handle node clicks
  const handleNodeClick = (nodeId: string) => {
    if (nodeId === 'todays:question' && dailyData?.question) {
      setShowQuestionDetail(true);
    }
  };

  // Handle question detail close
  const handleQuestionDetailClose = () => {
    setShowQuestionDetail(false);
  };

  if (isLoading) {
    return (
      <div className="pt-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-gray-500">
            오늘의 질문을 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6">
      {/* Back to Homepage Button */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          aria-label="Back to homepage"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700">홈으로</span>
        </button>
      </div>

      {/* Mindmap Canvas */}
      <MindmapCanvas 
        key={`todays-${(dailyData?.question as any)?.id || 'none'}`} 
        schema={schema}
        onNodeClick={handleNodeClick}
      />

      {/* No question message */}
      {!dailyData?.question && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-lg mb-2">오늘의 질문이 설정되지 않았습니다.</div>
            <div className="text-sm">관리자가 곧 멋진 질문을 준비할 예정입니다.</div>
          </div>
        </div>
      )}
      
      {/* Question Detail Modal */}
      {showQuestionDetail && dailyData?.question && (
        <QuestionDetailView
          slug="daily" // Use special slug for daily questions
          questionId={(dailyData.question as any)?.id}
          onClose={handleQuestionDetailClose}
        />
      )}
      
      {/* Debug info (remove in production) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          <div>Today's Question: {dailyData?.question ? 'Set' : 'None'}</div>
          <div>Question ID: {(dailyData?.question as any)?.id || 'N/A'}</div>
        </div>
      )}
    </div>
  );
}