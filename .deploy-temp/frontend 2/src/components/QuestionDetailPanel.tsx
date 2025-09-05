// src/components/QuestionDetailPanel.tsx
import React from 'react';
import type { KeywordQuestion } from '@/pages/DefineTopic/makeDefineSchema';

interface QuestionDetailPanelProps {
  question: KeywordQuestion | null;
  keyword: string;
  isOpen: boolean;
  onClose: () => void;
  onWriteClick: (questionId: number) => void;
}

export function QuestionDetailPanel({ 
  question, 
  keyword, 
  isOpen, 
  onClose, 
  onWriteClick 
}: QuestionDetailPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {keyword} Question
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Admin-curated question for this keyword
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
              aria-label="Close panel"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {question ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {question.title}
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {question.body}
                </p>
              </div>

              {question.tags && question.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {question.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {question.isDaily && (
                <div className="flex items-center text-sm text-amber-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Daily Question
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => onWriteClick(question.id)}
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Write Response to This Question
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Question Assigned
              </h3>
              <p className="text-gray-600 mb-4">
                This keyword doesn't have an associated question yet. 
                You can suggest one through the admin panel.
              </p>
              <button
                onClick={onClose}
                className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}