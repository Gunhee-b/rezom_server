import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAnswers, getQuestionDetail, updateAnswer, deleteAnswer, getAnswerComments, createComment, updateComment, deleteComment, type Answer, type QuestionDetail, type Comment, type CreateCommentRequest } from '@/api/define';
import { useAuth } from '@/hooks/useAuth';
import { EditAnswerModal } from '@/components/EditAnswerModal';
import { DeleteAnswerModal } from '@/components/DeleteAnswerModal';

export default function AnswerDetailPage() {
  const { slug, questionId, answerId } = useParams<{ 
    slug: string; 
    questionId: string; 
    answerId: string; 
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken, isAuthed, user } = useAuth();
  const [editingAnswer, setEditingAnswer] = useState<Answer | null>(null);
  const [deletingAnswer, setDeletingAnswer] = useState<Answer | null>(null);
  
  // Comment states
  const [commentBody, setCommentBody] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editCommentBody, setEditCommentBody] = useState('');

  const questionIdNum = questionId ? parseInt(questionId) : 0;
  const answerIdNum = answerId ? parseInt(answerId) : 0;

  // Fetch question details for context
  const { data: question } = useQuery<QuestionDetail>({
    queryKey: ['question-detail', slug, questionIdNum],
    queryFn: () => getQuestionDetail(slug!, questionIdNum),
    enabled: !!slug && !!questionIdNum,
  });

  // Fetch all answers for the question
  const { data: answers, isLoading: answersLoading, error } = useQuery<Answer[]>({
    queryKey: ['question-answers', questionIdNum],
    queryFn: () => getAnswers(questionIdNum),
    enabled: !!questionIdNum,
  });

  // Find the specific answer
  const answer = answers?.find(a => a.id === answerIdNum);

  // Fetch comments for this answer
  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ['answer-comments', answerIdNum],
    queryFn: () => getAnswerComments(answerIdNum),
    enabled: !!answerIdNum,
  });

  // Update answer mutation
  const updateAnswerMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { title?: string; body: string } }) => {
      return updateAnswer(id, data, accessToken || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-answers', questionIdNum] });
      setEditingAnswer(null);
    },
    onError: (error: any) => {
      console.error('Answer update error:', error);
    },
  });

  // Delete answer mutation
  const deleteAnswerMutation = useMutation({
    mutationFn: (id: number) => {
      return deleteAnswer(id, accessToken || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-answers', questionIdNum] });
      setDeletingAnswer(null);
      // Navigate back to question detail after deletion
      navigate(`/define/${slug}?questionId=${questionIdNum}`);
    },
    onError: (error: any) => {
      console.error('Answer delete error:', error);
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (data: CreateCommentRequest) => {
      return createComment(data, accessToken || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answer-comments', answerIdNum] });
      setCommentBody('');
      setShowCommentForm(false);
    },
    onError: (error: any) => {
      console.error('Comment creation error:', error);
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { body: string } }) => {
      return updateComment(id, data, accessToken || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answer-comments', answerIdNum] });
      setEditingComment(null);
      setEditCommentBody('');
    },
    onError: (error: any) => {
      console.error('Comment update error:', error);
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (id: number) => {
      return deleteComment(id, accessToken || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answer-comments', answerIdNum] });
    },
    onError: (error: any) => {
      console.error('Comment delete error:', error);
    },
  });

  // Check if current user owns this answer
  const isAnswerOwner = answer && user && answer.User.id === user.id;

  const handleEdit = () => {
    if (answer) {
      setEditingAnswer(answer);
    }
  };

  const handleDelete = () => {
    if (answer) {
      setDeletingAnswer(answer);
    }
  };

  const handleBackToQuestion = () => {
    navigate(`/define/${slug}?questionId=${questionIdNum}`);
  };

  const navigateToAnswer = (nextAnswerId: number) => {
    navigate(`/define/${slug}/questions/${questionIdNum}/answers/${nextAnswerId}`);
  };

  // Comment handlers
  const handleCreateComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;

    if (!isAuthed || !accessToken) {
      alert('로그인이 필요합니다.');
      return;
    }

    createCommentMutation.mutate({
      answerId: answerIdNum,
      body: commentBody.trim(),
    });
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment);
    setEditCommentBody(comment.body);
  };

  const handleUpdateComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComment || !editCommentBody.trim()) return;

    updateCommentMutation.mutate({
      id: editingComment.id,
      data: { body: editCommentBody.trim() },
    });
  };

  const handleDeleteComment = (commentId: number) => {
    if (confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  if (answersLoading) {
    return (
      <div className="pt-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !answer) {
    return (
      <div className="pt-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">답변을 찾을 수 없습니다</h1>
            <p className="text-gray-600 mb-6">요청하신 답변이 존재하지 않거나 삭제되었습니다.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleBackToQuestion}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                질문으로 돌아가기
              </button>
              <button
                onClick={() => navigate(`/define/${slug}`)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                개념 페이지로
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <button
            onClick={() => navigate(`/define/${slug}`)}
            className="hover:text-emerald-600 transition-colors"
          >
            {slug}
          </button>
          <span>/</span>
          <button
            onClick={handleBackToQuestion}
            className="hover:text-emerald-600 transition-colors line-clamp-1"
          >
            {question?.title || `질문 ${questionIdNum}`}
          </button>
          <span>/</span>
          <span className="text-gray-900">답변</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {answer.title || '답변'}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>작성자: {answer.User.email}</span>
              <span>작성일: {new Date(answer.createdAt).toLocaleString('ko-KR')}</span>
              {answer.updatedAt !== answer.createdAt && (
                <span>수정일: {new Date(answer.updatedAt).toLocaleString('ko-KR')}</span>
              )}
            </div>
          </div>
          
          {/* CRUD Buttons - only show if user owns the answer */}
          {isAnswerOwner && (
            <div className="flex gap-2 ml-4">
              <button
                onClick={handleEdit}
                className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="답변 수정"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="답변 삭제"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Answer Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-8">
          <div className="prose max-w-none">
            <div className="text-gray-800 whitespace-pre-wrap leading-relaxed text-lg">
              {answer.body}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              댓글 ({comments.length})
            </h2>
            {isAuthed && !showCommentForm && (
              <button
                onClick={() => setShowCommentForm(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm"
              >
                댓글 작성
              </button>
            )}
          </div>

          {/* Comment Form */}
          {showCommentForm && (
            <form onSubmit={handleCreateComment} className="mb-6 p-4 bg-emerald-50 rounded-lg">
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="댓글을 작성해주세요..."
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                disabled={createCommentMutation.isPending}
              />
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="submit"
                  disabled={!commentBody.trim() || createCommentMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
                >
                  {createCommentMutation.isPending ? '작성 중...' : '댓글 작성'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCommentForm(false);
                    setCommentBody('');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                >
                  취소
                </button>
              </div>
            </form>
          )}

          {/* Comments List */}
          {commentsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">{comment.User.email}</span>
                      <span>•</span>
                      <span>{new Date(comment.createdAt).toLocaleString('ko-KR')}</span>
                    </div>
                    {user && comment.authorId === user.id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditComment(comment)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="댓글 수정"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="댓글 삭제"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  {editingComment?.id === comment.id ? (
                    <form onSubmit={handleUpdateComment} className="mt-2">
                      <textarea
                        value={editCommentBody}
                        onChange={(e) => setEditCommentBody(e.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        disabled={updateCommentMutation.isPending}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          type="submit"
                          disabled={!editCommentBody.trim() || updateCommentMutation.isPending}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-sm"
                        >
                          {updateCommentMutation.isPending ? '수정 중...' : '수정'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingComment(null);
                            setEditCommentBody('');
                          }}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm"
                        >
                          취소
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-gray-800 whitespace-pre-wrap">{comment.body}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>아직 댓글이 없습니다.</p>
              <p className="text-sm mt-1">첫 번째 댓글을 작성해보세요!</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <button
              onClick={handleBackToQuestion}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              질문으로 돌아가기
            </button>
            
            {/* Navigate to My Writings */}
            {isAuthed && (
              <button
                onClick={() => navigate('/users/me')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                내 글 보기
              </button>
            )}
          </div>
          
          {/* Answer navigation (if there are multiple answers) */}
          {answers && answers.length > 1 && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                답변 {answers.findIndex(a => a.id === answerIdNum) + 1} / {answers.length}
              </span>
              <div className="flex gap-2">
                {answers.map((a, index) => (
                  <button
                    key={a.id}
                    onClick={() => navigateToAnswer(a.id)}
                    className={`w-10 h-10 text-sm rounded-lg transition-colors ${
                      a.id === answerIdNum 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                    title={a.title || `답변 ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit Answer Modal */}
        {editingAnswer && (
          <EditAnswerModal
            answer={editingAnswer}
            onClose={() => setEditingAnswer(null)}
            onSave={(data) => updateAnswerMutation.mutate({ id: editingAnswer.id, data })}
            isLoading={updateAnswerMutation.isPending}
          />
        )}

        {/* Delete Answer Confirmation Modal */}
        {deletingAnswer && (
          <DeleteAnswerModal
            answer={deletingAnswer}
            onClose={() => setDeletingAnswer(null)}
            onConfirm={() => deleteAnswerMutation.mutate(deletingAnswer.id)}
            isLoading={deleteAnswerMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}