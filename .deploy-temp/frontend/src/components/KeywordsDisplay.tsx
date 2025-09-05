import { type ConceptKeyword } from '@/api/define';

interface KeywordsDisplayProps {
  keywords?: ConceptKeyword[];
  isLoading?: boolean;
  showInactive?: boolean;
}

export function KeywordsDisplay({ 
  keywords, 
  isLoading = false, 
  showInactive = false 
}: KeywordsDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div 
            key={i}
            className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!keywords || keywords.length === 0) {
    return (
      <p className="text-sm text-neutral-500">아직 키워드가 없습니다.</p>
    );
  }

  const displayKeywords = keywords
    .filter(k => showInactive || k.active)
    .sort((a, b) => a.position - b.position);

  if (displayKeywords.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        활성화된 키워드가 없습니다.
      </p>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {displayKeywords.map((keyword) => (
        <span
          key={keyword.id}
          className={`px-3 py-1 text-sm rounded-full transition-all duration-300 ${
            keyword.active
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : 'bg-gray-100 text-gray-600 border-gray-200 opacity-60'
          } border`}
        >
          <span className="text-xs opacity-70">#{keyword.position}</span>{' '}
          {keyword.keyword}
        </span>
      ))}
    </div>
  );
}