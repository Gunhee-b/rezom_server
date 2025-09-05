// src/test/setupTests.ts
import '@testing-library/jest-dom'
import 'whatwg-fetch'
import { server } from './server'

// ----- DOM API 폴리필/목 -----
class RO { observe(){} unobserve(){} disconnect(){} }
(global as any).ResizeObserver = RO as any

let ioInstances: Array<{ cb: IntersectionObserverCallback; el?: Element }> = []
class IO {
  cb: IntersectionObserverCallback
  constructor(cb: IntersectionObserverCallback) { this.cb = cb }
  observe(el: Element) { ioInstances.push({ cb: this.cb, el }) }
  unobserve() {}
  disconnect() {}
}
;(global as any).IntersectionObserver = IO as any

;(global as any).requestAnimationFrame = (fn: FrameRequestCallback) =>
  setTimeout(() => fn(performance.now()), 0)

// jsdom 기본 rect(0) 보정
const origGetBCR = Element.prototype.getBoundingClientRect
Element.prototype.getBoundingClientRect = function () {
  const r = origGetBCR.apply(this)
  if (r.width === 0 && r.height === 0) {
    return { x:100, y:100, top:100, left:100, bottom:140, right:200,
      width:100, height:40, toJSON(){} } as DOMRect
  }
  return r
}

// MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// 교차 관찰 수동 트리거 헬퍼
;(global as any).__triggerIntersect = (visible = true) => {
  ioInstances.forEach(({ cb, el }) => {
    const entry = {
      isIntersecting: visible,
      intersectionRatio: visible ? 1 : 0,
      target: el!,
      time: 0,
      boundingClientRect: {} as any,
      intersectionRect: {} as any,
      rootBounds: {} as any
    } as IntersectionObserverEntry
    cb([entry], {} as IntersectionObserver)
  })
}

const origError = console.error
console.error = (...args: any[]) => {
  const msg = String(args[0] ?? '')
  // act 경고/Router future 경고/DOM ref prop 경고만 필터
  if (
    msg.includes('not wrapped in act') ||
    msg.includes('React Router Future Flag Warning') ||
    msg.includes('`ref` is not a prop')
  ) {
    return
  }
  origError(...args)
}