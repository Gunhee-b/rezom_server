import { useEffect, useRef, useState, useCallback } from 'react';

export interface ConceptUpdateEvent {
  type: 'concept-update' | 'connected';
  conceptSlug?: string;
  timestamp?: number;
  data?: {
    action?: string;
    questionId?: number;
    questionTitle?: string;
  };
}

interface UseConceptUpdatesOptions {
  enabled?: boolean;
  onUpdate?: (event: ConceptUpdateEvent) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useConceptUpdates(
  conceptSlug: string,
  options: UseConceptUpdatesOptions = {}
) {
  const {
    enabled = true,
    onUpdate,
    onError,
    onConnect,
    onDisconnect
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<ConceptUpdateEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 3;

  const connect = useCallback(() => {
    if (!enabled || !conceptSlug || eventSourceRef.current) {
      return;
    }

    try {
      // Construct the SSE URL
      const baseUrl = import.meta.env.VITE_API_URL || 'https://api.rezom.org';
      const url = `${baseUrl}/define/concepts/${conceptSlug}/updates`;
      
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0; // Reset attempts on successful connection
        onConnect?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const data: ConceptUpdateEvent = JSON.parse(event.data);
          setLastEvent(data);
          
          // Only call onUpdate for actual updates, not connection messages
          if (data.type === 'concept-update') {
            onUpdate?.(data);
          }
        } catch (err) {
          console.warn('Failed to parse SSE data:', event.data);
        }
      };

      eventSource.onerror = (event) => {
        setIsConnected(false);
        reconnectAttempts.current++;
        
        // Cleanup on error
        eventSource.close();
        eventSourceRef.current = null;
        
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError(`Connection failed after ${maxReconnectAttempts} attempts. SSE disabled.`);
          onError?.(event);
          return; // Stop trying to reconnect
        }
        
        setError(`Connection error (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
        onError?.(event);
        
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, reconnectAttempts.current) * 1000;
        
        // Clear any existing timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          // Only reconnect if still enabled and no connection exists
          if (enabled && conceptSlug && !eventSourceRef.current) {
            connect();
          }
        }, delay);
      };

    } catch (err) {
      setError('Failed to establish SSE connection');
      console.error('SSE connection error:', err);
    }
  }, [enabled, conceptSlug, onUpdate, onError, onConnect]);

  const disconnect = useCallback(() => {
    // Clear any pending reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      onDisconnect?.();
    }
    
    // Reset reconnection attempts
    reconnectAttempts.current = 0;
    setError(null);
  }, [onDisconnect]);

  // Effect to manage connection
  useEffect(() => {
    if (enabled && conceptSlug) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      disconnect();
    };
  }, [enabled, conceptSlug, connect, disconnect]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    lastEvent,
    error,
    connect,
    disconnect,
    reconnectAttempts: reconnectAttempts.current,
    maxReconnectAttempts,
  };
}