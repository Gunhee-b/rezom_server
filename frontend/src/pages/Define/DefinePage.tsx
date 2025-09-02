import { useMemo, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getKeywords, type TopFiveKeyword, type ConceptKeyword } from '@/api/define'
import { MindmapCanvas } from '@/widgets/mindmap/MindmapCanvas'
import { defineSchema } from './define.schema'
import { QuestionDetailView } from '@/components/QuestionDetailView'
import { useConceptUpdates } from '@/hooks/useConceptUpdates'

// Type guard to check if data is Top-5 format
function isTop5Format(data: ConceptKeyword[] | TopFiveKeyword[]): data is TopFiveKeyword[] {
  return data.length > 0 && 'rank' in data[0] && 'questionId' in data[0];
}

export default function DefinePage() {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Default to language-definition if no slug provided
  const conceptSlug = slug || 'language-definition';
  const questionId = searchParams.get('questionId');
  
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(
    questionId ? parseInt(questionId) : null
  );

  // Fetch keywords (Top-5 format if available, fallback to ConceptKeyword)
  const { data: keywordsData, isLoading } = useQuery({
    queryKey: ['concept-keywords', conceptSlug],
    queryFn: () => getKeywords(conceptSlug),
  });

  // SSE integration for real-time updates - TEMPORARILY DISABLED
  useConceptUpdates(conceptSlug, {
    enabled: false, // Disabled to prevent connection loop causing network spam
    onUpdate: (event) => {
      // Invalidate queries on concept updates
      queryClient.invalidateQueries({ queryKey: ['concept-keywords', conceptSlug] });
      if (selectedQuestionId) {
        queryClient.invalidateQueries({ 
          queryKey: ['question-detail', conceptSlug, selectedQuestionId] 
        });
      }
    },
  });

  // Transform data into mindmap schema
  const schema = useMemo(() => {
    // Start with base schema
    const s = JSON.parse(JSON.stringify(defineSchema)) as typeof defineSchema;

    // Update center node to fixed "Definition" text
    const center = s.nodes.find(n => n.id.endsWith(':title'));
    if (center) {
      center.label = 'Definition';
    }

    // Clear existing nodes and edges (except center)
    s.nodes = s.nodes.filter(n => n.id.endsWith(':title'));
    s.edges = [];

    if (keywordsData && keywordsData.length > 0) {
      let nodes = [];
      
      if (isTop5Format(keywordsData)) {
        // Top-5 format: use rank order and questionId for navigation
        nodes = keywordsData
          .sort((a, b) => a.rank - b.rank)
          .map((keyword, index) => {
            const angle = (index / keywordsData.length) * 2 * Math.PI - Math.PI / 2;
            const radius = 30;
            const x = 50 + radius * Math.cos(angle);
            const y = 48 + radius * Math.sin(angle);
            
            return {
              id: `def:q${keyword.questionId}`,
              x: Math.max(5, Math.min(95, x)),
              y: Math.max(10, Math.min(85, y)),
              label: keyword.label,
              size: 'sm' as const,
              questionId: keyword.questionId, // Store for click handling
              rank: keyword.rank,
            };
          });
      } else {
        // Fallback ConceptKeyword format
        const conceptKeywords = keywordsData as ConceptKeyword[];
        nodes = conceptKeywords
          .filter(k => k.active)
          .sort((a, b) => a.position - b.position)
          .slice(0, 5)
          .map((keyword, index) => {
            const angle = (index / Math.min(conceptKeywords.length, 5)) * 2 * Math.PI - Math.PI / 2;
            const radius = 30;
            const x = 50 + radius * Math.cos(angle);
            const y = 48 + radius * Math.sin(angle);
            
            return {
              id: `def:${keyword.keyword.toLowerCase()}`,
              x: Math.max(5, Math.min(95, x)),
              y: Math.max(10, Math.min(85, y)),
              label: keyword.keyword,
              size: 'sm' as const,
            };
          });
      }

      s.nodes.push(...nodes);

      // Create edges from center to keyword nodes
      if (center) {
        const edges = nodes.map((node, index) => ({
          id: `def:edge-${index}`,
          from: center.id,
          to: node.id,
          style: (selectedQuestionId && 'questionId' in node && node.questionId === selectedQuestionId) 
            ? 'green' as const 
            : (index % 2 === 0 ? 'green' as const : 'thin' as const),
          curvature: 0.1 + (index * 0.05)
        }));
        s.edges.push(...edges);
      }
    }

    return s;
  }, [keywordsData, selectedQuestionId]);

  // Handle node clicks
  const handleNodeClick = (nodeId: string) => {
    if (!keywordsData || !isTop5Format(keywordsData)) return;
    
    // Extract questionId from node
    const node = schema.nodes.find(n => n.id === nodeId);
    if (node && 'questionId' in node && typeof node.questionId === 'number') {
      const questionId = node.questionId;
      setSelectedQuestionId(questionId);
      
      // Update URL without full navigation
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('questionId', questionId.toString());
      navigate(`/define/${conceptSlug}?${newSearchParams.toString()}`, { replace: true });
    }
  };

  // Handle question detail close
  const handleQuestionDetailClose = () => {
    setSelectedQuestionId(null);
    
    // Remove questionId from URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('questionId');
    const newSearch = newSearchParams.toString();
    navigate(`/define/${conceptSlug}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="pt-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-gray-500">
            개념을 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6">
      {/* Mindmap Canvas */}
      <MindmapCanvas 
        key={`${conceptSlug}-${keywordsData?.length || 0}-${selectedQuestionId || 'none'}`} 
        schema={schema}
        onNodeClick={handleNodeClick}
      />
      
      {/* Question Detail Modal */}
      {selectedQuestionId && (
        <QuestionDetailView
          slug={conceptSlug}
          questionId={selectedQuestionId}
          onClose={handleQuestionDetailClose}
        />
      )}
      
      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          <div>Slug: {conceptSlug}</div>
          <div>Keywords: {keywordsData?.length || 0}</div>
          <div>Format: {keywordsData && isTop5Format(keywordsData) ? 'Top-5' : 'Fallback'}</div>
          <div>Selected: {selectedQuestionId || 'None'}</div>
        </div>
      )}
    </div>
  );
}