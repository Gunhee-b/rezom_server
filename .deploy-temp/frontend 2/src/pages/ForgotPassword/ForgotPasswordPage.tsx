import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/shared/lib/axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            비밀번호 재설정
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            가입하신 이메일 주소를 입력해주세요
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              이메일 주소
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="이메일 주소"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {loading ? '전송 중...' : '재설정 링크 전송'}
            </button>
          </div>

          {message && (
            <div className="text-center text-sm text-green-600 bg-green-50 p-3 rounded">
              {message}
            </div>
          )}

          {error && (
            <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <div className="text-center">
            <Link
              to="/"
              className="text-sm text-emerald-600 hover:text-emerald-500"
            >
              로그인으로 돌아가기
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
