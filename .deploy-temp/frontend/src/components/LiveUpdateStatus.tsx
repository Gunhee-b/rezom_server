import { useState, useEffect } from 'react';

interface LiveUpdateStatusProps {
  isConnected: boolean;
  error?: string | null;
  updateCount?: number;
  lastMessage?: string | null;
}

export function LiveUpdateStatus({ 
  isConnected, 
  error, 
  updateCount = 0, 
  lastMessage 
}: LiveUpdateStatusProps) {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (lastMessage) {
      setShowMessage(true);
      const timer = setTimeout(() => setShowMessage(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [lastMessage]);

  return (
    <div className="mx-auto max-w-3xl px-4 mb-4">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span 
              className={`inline-block w-2 h-2 rounded-full transition-colors duration-300 ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            {isConnected && (
              <span className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" />
            )}
          </div>
          <span className="text-gray-600">
            실시간 업데이트 {isConnected ? '연결됨' : '연결 안됨'}
          </span>
          {updateCount > 0 && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
              {updateCount}개 업데이트
            </span>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-1">
            <span className="text-red-500 text-xs">⚠</span>
            <span className="text-red-600 text-xs">연결 오류</span>
          </div>
        )}
      </div>
      
      {/* Live Update Message with Animation */}
      {showMessage && lastMessage && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 animate-slideDown">
          <div className="flex items-center gap-2">
            <div className="animate-spin text-blue-600">🔄</div>
            <span>{lastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}