import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MindmapCanvas } from '@/widgets/mindmap/MindmapCanvas';
import { homeSchema } from './home.schema';
import { TOKENS } from '@/shared/theme/tokens';
import { Pt, quadPath } from '@/shared/lib/svg';
import LoginSection from '@/molecules/LoginSection';
import { useAuth } from '@/hooks/useAuth';

const VIEWBOX_W = TOKENS.viewBox.w;
const BASE_VINE = TOKENS.edge.map.green.width;

function centerOf(el: Element | null): Pt | null {
  if (!el) return null;
  const r = (el as HTMLElement).getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export default function HomePage() {
  const { isAuthed, logout, isInitialized } = useAuth();
  const [openLogin, setOpenLogin] = useState(() => {
    // Auto-open login if redirected from auth error
    return !!sessionStorage.getItem('redirectAfterLogin');
  });
  const [logoFontPx, setLogoFontPx] = useState<number>(TOKENS.typography.logo.size);
  const [showDevMessage, setShowDevMessage] = useState(false);
  const authed = isInitialized ? isAuthed : false; // Only consider authed when initialized

  // overlay vine
  const [vineD, setVineD] = useState<string | null>(null);
  const [drawVine, setDrawVine] = useState(false);
  const [vineWidth, setVineWidth] = useState(6);

  const loginBtnRef = useRef<HTMLButtonElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // 로고 실측 → Login 텍스트 크기(50%)
  useEffect(() => {
    const selector = 'svg text[data-role="logo-text"]';
    const query = () => document.querySelector<SVGTextElement>(selector);

    const measure = () => {
      const t = query();
      if (!t) return;
      const rect = t.getBoundingClientRect();
      const h = rect.height;
      setLogoFontPx(Math.max(28, Math.min(72, Math.round(h))));
    };

    measure();
    const ro = new ResizeObserver(measure);
    const el = query();
    if (el) ro.observe(el);

    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // 캔버스 폭 기준 오버레이 선 두께 환산
  useEffect(() => {
    const calcWidth = () => {
      const svg = document.querySelector<SVGSVGElement>('[data-canvas-root]');
      const w = svg?.getBoundingClientRect().width ?? window.innerWidth;
      const px = (w / VIEWBOX_W) * BASE_VINE;
      setVineWidth(Math.max(2.5, Math.min(10, px)));
    };
    calcWidth();
    window.addEventListener('resize', calcWidth);
    return () => window.removeEventListener('resize', calcWidth);
  }, []);

  // Storage sync is now handled by useAuth hook

  // Check if dev message should be shown (one-time only)
  useEffect(() => {
    const hasSeenDevMessage = localStorage.getItem('hasSeenDevMessage');
    if (!hasSeenDevMessage) {
      setShowDevMessage(true);
    }
  }, []);

  // Handle Escape key to close dev message
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDevMessage(false);
        localStorage.setItem('hasSeenDevMessage', 'true');
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // 섹션 보이면(미로그인일 때) ReZom→Login 경로 계산 & 드로우
  useEffect(() => {
    if (authed) return;

    const sec = sectionRef.current;
    if (!sec) return;

    const onIntersect: IntersectionObserverCallback = (entries) => {
      const visible = entries.some((e) => e.isIntersecting && e.intersectionRatio > 0.2);
      if (!visible) return;

      const logoEl = document.querySelector('svg text[data-role="logo-text"]');
      const start = centerOf(logoEl);
      const end = centerOf(loginBtnRef.current!);
      if (!start || !end) return;

      setVineD(quadPath(start, end, 0.18));
      setDrawVine(false);
      requestAnimationFrame(() => setDrawVine(true));
    };

    const io = new IntersectionObserver(onIntersect, { threshold: [0.2, 0.6] });
    io.observe(sec);
    return () => io.disconnect();
  }, [authed]);

  // 리사이즈/스크롤 재계산 (미로그인일 때만)
  useEffect(() => {
    const recalc = () => {
      if (authed) return;

      const logoEl = document.querySelector('svg text[data-role="logo-text"]');
      const start = centerOf(logoEl);
      const end = centerOf(loginBtnRef.current);
      if (!start || !end) return;

      setVineD(quadPath(start, end, 0.18));
    };

    window.addEventListener('resize', recalc);
    window.addEventListener('scroll', recalc, { passive: true });
    return () => {
      window.removeEventListener('resize', recalc);
      window.removeEventListener('scroll', recalc);
    };
  }, [authed]);

  // ✅ authed가 true면 오버레이 즉시 제거(깜빡임 방지)
  useEffect(() => {
    if (authed) {
      setDrawVine(false);
      setVineD(null);
    }
  }, [authed]);

  const toggleLogin = () => setOpenLogin((v) => !v);

  const handleLoginSuccess = () => {
    setOpenLogin(false);
    setDrawVine(false);
    
    // Check if there's a redirect URL stored from authentication error
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
      sessionStorage.removeItem('redirectAfterLogin');
      window.location.href = redirectUrl; // Navigate back to the original page
    }
  };

  const handleLogout = async () => {
    try {
      await logout(); // 서버에 세션/리프레시 쿠키 정리 요청
    } catch {
      // 네트워크 실패해도 클라이언트 상태는 정리
    } finally {
      setOpenLogin(false);
      // 로그아웃 직후 경로 재계산(덩굴 다시 보여주기)
      requestAnimationFrame(() => {
        const logoEl = document.querySelector('svg text[data-role="logo-text"]');
        const start = centerOf(logoEl);
        const end = centerOf(loginBtnRef.current);
        if (start && end) setVineD(quadPath(start, end, 0.18));
        setDrawVine(true);
      });
    }
  };

  // 미로그인 시, 캔버스의 작은 green edge 숨김
  const derivedSchema = {
    ...homeSchema,
    edges: authed ? homeSchema.edges : homeSchema.edges.filter((e) => e.style !== 'green'),
  };

  return (
    <main 
      className="min-h-screen bg-gradient-to-br from-gray-50 to-white"
      style={{
        backgroundImage: 'url(/wallpaper.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* 상단 허브 */}
      <div className="pt-6">
        <MindmapCanvas schema={derivedSchema} />
      </div>

      {/* 오버레이 초록선: 로그인 필요시에만 */}
      <AnimatePresence>
        {!authed && vineD && drawVine && (
          <motion.svg
            key="vine-overlay"
            className="pointer-events-none fixed inset-0 w-screen h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.path
              d={vineD}
              fill="none"
              stroke={TOKENS.colors.green}
              strokeWidth={vineWidth}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: TOKENS.animation.vineDraw, ease: 'easeInOut' }}
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* 아래 섹션: molecule 사용 */}
      <section ref={sectionRef}>
        <LoginSection
          ref={loginBtnRef}
          authed={authed}
          open={openLogin}
          onToggle={toggleLogin}
          onSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          buttonFontPx={logoFontPx * 0.6}
          panelScale={1}
          isInitialized={isInitialized}
        />
      </section>

      {/* Development Status Modal */}
      {showDevMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">개발 상태 안내</h2>
                <button
                  onClick={() => {
                    setShowDevMessage(false);
                    localStorage.setItem('hasSeenDevMessage', 'true');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close message"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-amber-800 text-sm font-medium whitespace-pre-line">
                  현재 로그인 상태의 일부 오류로 로그인하시고 새로고침 해주셔야 정상 이용이 가능합니다. 사용을 완료하시고 로그아웃 해주셔야 이후 과정에서도 문제가 발생하지 않습니다. 빠른 시일 내에 해결하도록 노력하겠습니다.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800 text-sm font-medium whitespace-pre-line">
                  또, 현재 'Description by Metaphor' 기능, 'Analyzing the World' 기능, 'Recommended Questions' 기능은 개발 중입니다 빠른 시일 내에 선보일 수 있도록 노력하겠습니다.
                </p>
              </div>

              <div className="text-center">
                <p className="text-gray-700 text-sm font-medium mb-2">
                  베타 테스트에 참여해주시는 여러분들 진심으로 감사합니다.
                </p>
                <p className="text-gray-600 text-sm italic">
                  -리좀 개발자 올림
                </p>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setShowDevMessage(false);
                    localStorage.setItem('hasSeenDevMessage', 'true');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  확인
                </button>
              </div>
              
              <p className="text-gray-500 text-xs mt-4 text-center">
                ESC 키를 눌러서 닫을 수 있습니다
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
