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
/** Pause before scroll so the opening frame reads clearly. */
export const SHOWCASE_SCROLL_HOLD_MS = 1000
/** Leave this much content below the fold so the clip implies more to see. */
const DEFAULT_SCROLL_LEAVE_HIDDEN_PX = 360

type Props = {
  children: ReactNode
  active: boolean
  durationMs?: number
  /**
   * Unscaled pixels of content to leave unseen at the bottom.
   * Higher = stop further from the true end.
   */
  scrollLeaveHiddenPx?: number
  /** Wait before scroll begins (e.g. opening hold or chart layout). */
  scrollStartDelayMs?: number
}

export function PremiumScrollViewport({
  children,
  active,
  durationMs = 15000,
  scrollLeaveHiddenPx = DEFAULT_SCROLL_LEAVE_HIDDEN_PX,
  scrollStartDelayMs = SHOWCASE_SCROLL_HOLD_MS,
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
    const maxTravel = Math.max(0, content.scrollHeight - visibleUnscaled)
    const distance = Math.max(0, maxTravel - Math.max(0, scrollLeaveHiddenPx))
    setScrollY(distance)
    setCanScroll(distance > 12)
  }, [scrollLeaveHiddenPx])

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
