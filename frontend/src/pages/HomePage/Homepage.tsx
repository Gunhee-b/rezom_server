import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MindmapCanvas } from '@/widgets/mindmap/MindmapCanvas';
import { homeSchema } from './home.schema';
import { TOKENS } from '@/shared/theme/tokens';
import { Pt, quadPath } from '@/shared/lib/svg';
import LoginSection from '@/molecules/LoginSection';
import { logout } from '@/shared/api/auth'; // ✅ 사용: 로그아웃 API

const VIEWBOX_W = TOKENS.viewBox.w;
const BASE_VINE = TOKENS.edge.map.green.width;

function centerOf(el: Element | null): Pt | null {
  if (!el) return null;
  const r = (el as HTMLElement).getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export default function HomePage() {
  const [openLogin, setOpenLogin] = useState(() => {
    // Auto-open login if redirected from auth error
    return !!sessionStorage.getItem('redirectAfterLogin');
  });
  const [logoFontPx, setLogoFontPx] = useState<number>(TOKENS.typography.logo.size);
  const [authed, setAuthed] = useState(() => localStorage.getItem('authed') === '1');

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

  // ✅ storage 이벤트로 다른 탭/컴포넌트와 상태 동기화
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'authed') setAuthed(e.newValue === '1');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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
    localStorage.setItem('authed', '1');
    setAuthed(true);
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
      localStorage.removeItem('authed');
      setAuthed(false);
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
    <main className="min-h-screen bg-neutral-50">
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
        />
      </section>
    </main>
  );
}
