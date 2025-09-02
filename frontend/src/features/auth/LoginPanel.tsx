import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type Props = {
  /** 버튼 실측 폰트(px). Home에서 로고 높이로 계산한 값 전달 */
  maxWidthPx?: number;
  /** 전체 폼 폭 배율 (0.2 = 20%) */
  scale?: number;
  /** 로그인 성공 시 호출 */
  onSuccess?: () => void;
};

// 데모 검증: rezom / seed 일치 시 성공
const demoValidate = (id: string, pw: string) => id.trim() === 'rezom' && pw === 'seed';

export default function LoginPanel({ maxWidthPx = 56, scale = 1, onSuccess }: Props) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fails, setFails] = useState(0);

  // 폼 최대 폭 계산: 버튼 폰트 크기 기반 → 축소 비율 반영
  const base = Math.max(180, Math.min(520, maxWidthPx * 5.8));
  const maxWidth = Math.round(base * scale); // 0.2면 20%

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (demoValidate(id, pw)) {
      setError(null);
      setFails(0);
      onSuccess?.();
      return;
    }
    setFails((f) => f + 1);
    setError('ID 또는 PASSWORD가 올바르지 않습니다.');
  };

  return (
    <section className="w-full mx-auto" style={{ maxWidth }} aria-live="polite">
      {/* 폼 내부 전역 폰트 축소 */}
      <form onSubmit={onSubmit} className="space-y-2 text-[10px] select-none">
        {/* ID 줄: 라벨 옆에 바로 타이핑 */}
        <div className="grid grid-cols-[auto_1fr] items-center gap-2">
          <span className="font-semibold tracking-wide">ID :</span>
          <input
            className="min-w-0 border-b border-neutral-300 px-1 py-0.5 outline-none focus:border-black transition bg-transparent text-[10px]"
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoComplete="username"
          />
        </div>

        {/* PASSWORD 줄 */}
        <div className="grid grid-cols-[auto_1fr] items-center gap-2">
          <span className="font-semibold tracking-wide">PW :</span>
          <input
            type="password"
            className="min-w-0 border-b border-neutral-300 px-1 py-0.5 outline-none focus:border-black transition bg-transparent text-[10px]"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {/* 에러: PASSWORD 바로 아래 플래시 */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.3, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="text-[10px] text-red-600 pl-[calc(10ch)]"
              // 대략 "PASSWORD :" 라벨 폭만큼 들여쓰기
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3회 실패 시 forgot password 표시 */}
        {fails >= 3 && (
          <div className="pl-[calc(10ch)]">
            <button
              type="button"
              onClick={() => alert('비밀번호 재설정 플로우(데모)')}
              className="underline underline-offset-2 text-neutral-600 hover:text-black transition"
            >
              forgot password
            </button>
          </div>
        )}

        <div className="pt-1">
          <button
            type="submit"
            className="w-full border border-black px-2 py-1 rounded-sm text-[10px] font-medium hover:bg-black hover:text-white transition"
          >
            Sign in
          </button>
        </div>
      </form>
    </section>
  );
}