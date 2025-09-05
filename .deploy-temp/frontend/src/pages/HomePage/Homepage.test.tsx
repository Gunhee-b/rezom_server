// Homepage.test.tsx
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import HomePage from './Homepage'
import { vi } from 'vitest'
import { act } from 'react'

// 1) MindmapCanvas 모킹 (named export 사용)
vi.mock('@/widgets/mindmap/MindmapCanvas', () => {
  const React = require('react')
  const MindmapCanvas: React.FC<any> = (props: any) => (
    <svg data-canvas-root width="800" height="400">
      <text data-role="logo-text" x="100" y="100">Rezom</text>
      <g data-testid="mindmap-stub">{JSON.stringify(!!props.schema)}</g>
    </svg>
  )
  return { MindmapCanvas }   // ✅ HomePage가 { MindmapCanvas }로 임포트하므로 named export
})

// 2) LoginSection 모킹 (default export)
// ---- 2) LoginSection 모킹: 버튼 ref 전달 + 클릭 시 onSuccess 호출
vi.mock('@/molecules/LoginSection', () => {
    // require 결과에 정확한 타입을 부여해 제네릭이 먹히게 함
    const React = require('react') as typeof import('react')
  
    type Props = {
      open: boolean
      onToggle: () => void
      onSuccess: () => void
      buttonFontPx?: number
    }
  
    // 이름 있는 함수 + 명시적 제네릭 + ForwardedRef 타입 지정
    const Login = React.forwardRef<HTMLButtonElement, Props>(function Login(
      props: Props,
      ref: React.ForwardedRef<HTMLButtonElement>
    ) {
      const { open, onToggle, onSuccess, buttonFontPx } = props
      return (
        <div>
          <button
            ref={ref}
            onClick={onToggle}
            aria-label="login-button"
            style={{ fontSize: buttonFontPx }}
          >
            로그인
          </button>
          {open && (
            <button onClick={() => onSuccess()} aria-label="confirm-login">
              로그인 성공(모킹)
            </button>
          )}
        </div>
      )
    })
  
    // forwardRef의 반환타입은 ForwardRefExoticComponent이므로 그대로 default로 반환
    return { __esModule: true, default: Login }
  })
  

function renderWithProviders(ui: React.ReactElement) {
const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
return render(
    <QueryClientProvider client={qc}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {ui}
    </MemoryRouter>
    </QueryClientProvider>
)
}

describe('HomePage', () => {
test('미로그인 시 로고→로그인 버튼으로 덩굴(오버레이 path)이 그려진다', async () => {
    localStorage.removeItem('authed')
    renderWithProviders(<HomePage />)

    // ⬇️ 상태 변경 유발 호출을 act로 감싸기
    await act(async () => {
    (globalThis as any).__triggerIntersect(true)
    })

    // ⬇️ 상태 안정화까지 대기
    await waitFor(() => {
    const path = document.querySelector('path')
    expect(path).toBeTruthy()
    expect(path?.getAttribute('stroke')).toBeTruthy()
    })
})

test('로그인 성공 시 오버레이 덩굴이 사라지고 상태가 전환된다', async () => {
    localStorage.removeItem('authed')
    renderWithProviders(<HomePage />)

    await act(async () => {
    (globalThis as any).__triggerIntersect(true)
    })
    await waitFor(() => expect(document.querySelector('path')).toBeTruthy())
    
    // 1) 로그인 버튼 클릭
    await userEvent.click(screen.getByLabelText('login-button'))
    // 2) 패널이 열려 confirm 버튼이 렌더될 때까지 대기
    const confirmBtn = await screen.findByLabelText('confirm-login')
    // 3) confirm 클릭
    await userEvent.click(confirmBtn)

    await waitFor(() => expect(document.querySelector('path')).toBeFalsy())
    expect(localStorage.getItem('authed')).toBe('1')
})

test('로그아웃 버튼 클릭 시 세션이 해제되고 덩굴이 다시 나타난다', async () => {
    // 1) 로그인된 상태로 시작
    localStorage.setItem('authed', '1')
    renderWithProviders(<HomePage />)
  
    // 로그인 상태면 오버레이(덩굴) 없어야 함
    await waitFor(() => {
      expect(document.querySelector('path')).toBeFalsy()
    })
  
    // 2) "로그아웃" 버튼 클릭
    const logoutBtn = await screen.findByLabelText('logout-button')
    await userEvent.click(logoutBtn)
  
    // 3) 내부에서 requestAnimationFrame으로 경로 재계산하므로,
    //    섹션 가시성 트리거를 한 번 줘서(보수적으로) 덩굴 등장 보장
    await act(async () => {
      (globalThis as any).__triggerIntersect(true)
    })
  
    // 4) 덩굴이 다시 나타났는지(미로그인 상태) 확인
    await waitFor(() => {
      expect(document.querySelector('path')).toBeTruthy()
    })
  
    // 5) 클라이언트 상태 정리 확인
    expect(localStorage.getItem('authed')).toBeNull()
  })
})