import { useEffect } from 'react'

type UserQuestion = {
  id: number;
  title: string;
  body: string;
};

interface DeleteConfirmModalProps {
  question: UserQuestion;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmModal({ question, onClose, onConfirm, isLoading }: DeleteConfirmModalProps) {
  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-center mb-2">
            질문을 삭제하시겠습니까?
          </h3>
          
          <div className="mb-6">
            <p className="text-sm text-gray-600 text-center mb-4">
              이 작업은 되돌릴 수 없습니다. 질문과 관련된 모든 답변도 함께 삭제됩니다.
            </p>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-sm text-gray-900 mb-1 line-clamp-1">
                {question.title}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {question.body}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}