import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

const SHOWCASE_SCALE = 0.46
const FOOTER_RESERVE_PX = 44
const DEFAULT_SCROLL_START_DELAY_MS = 480

type Props = {
  children: ReactNode
  active: boolean
  durationMs?: number
  /** Extra unscaled pixels to scroll past the bottom edge. */
  scrollOvershoot?: number
  /** Wait before scroll begins (e.g. for crossfade or chart layout). */
  scrollStartDelayMs?: number
}

export function PremiumScrollViewport({
  children,
  active,
  durationMs = 15000,
  scrollOvershoot = 100,
  scrollStartDelayMs = DEFAULT_SCROLL_START_DELAY_MS,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(0)
  const [canScroll, setCanScroll] = useState(false)
  const [scrollEnabled, setScrollEnabled] = useState(false)
  const [runId, setRunId] = useState(0)

  const measure = useCallback(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return
    const visibleUnscaled = Math.max(
      0,
      (viewport.clientHeight - FOOTER_RESERVE_PX) / SHOWCASE_SCALE,
    )
    const distance = Math.max(0, content.scrollHeight - visibleUnscaled + scrollOvershoot)
    setScrollY(distance)
    setCanScroll(distance > 12)
  }, [scrollOvershoot])

  useLayoutEffect(() => {
    measure()
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(content)
    return () => observer.disconnect()
  }, [measure, children])

  useEffect(() => {
    if (!active) {
      setScrollEnabled(false)
      return
    }

    setRunId((id) => id + 1)
    const timer = window.setTimeout(() => {
      measure()
      requestAnimationFrame(() => {
        measure()
        setScrollEnabled(true)
      })
    }, scrollStartDelayMs)
    return () => window.clearTimeout(timer)
  }, [active, measure, scrollStartDelayMs])

  const motionStyle = {
    '--showcase-scroll-y': `-${scrollY}px`,
    '--showcase-duration': `${durationMs}ms`,
  } as CSSProperties

  const shouldAnimate = active && scrollEnabled && canScroll

  return (
    <div ref={viewportRef} className="relative h-full overflow-hidden bg-white">
      <div className="absolute inset-0 overflow-hidden">
        <div
          style={{
            width: `${100 / SHOWCASE_SCALE}%`,
            transform: `scale(${SHOWCASE_SCALE})`,
            transformOrigin: 'top left',
          }}
        >
          <div
            key={runId}
            ref={contentRef}
            className={shouldAnimate ? 'premium-showcase-scroll-motion' : undefined}
            style={{
              ...motionStyle,
              transform: shouldAnimate ? undefined : 'translateY(0)',
            }}
          >
            <div className="pointer-events-none select-none px-1.5 pb-16">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
