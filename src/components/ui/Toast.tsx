import { createPortal } from 'react-dom'
import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  open: boolean
  title: string
  children?: ReactNode
  actionLabel?: string
  onAction?: () => void
  onClose: () => void
  durationMs?: number
}

const DEFAULT_DURATION_MS = 8000

export function Toast({
  open,
  title,
  children,
  actionLabel,
  onAction,
  onClose,
  durationMs = DEFAULT_DURATION_MS,
}: Props) {
  const remainingRef = useRef(durationMs)
  const timeoutRef = useRef<number | null>(null)
  const startedAtRef = useRef(0)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return

    function arm(ms: number) {
      if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current)
      startedAtRef.current = Date.now()
      timeoutRef.current = window.setTimeout(() => onCloseRef.current(), ms)
    }

    remainingRef.current = durationMs
    arm(durationMs)

    return () => {
      if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current)
    }
  }, [open, durationMs])

  function pauseTimer() {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    remainingRef.current = Math.max(1000, remainingRef.current - (Date.now() - startedAtRef.current))
  }

  function resumeTimer() {
    startedAtRef.current = Date.now()
    timeoutRef.current = window.setTimeout(() => onCloseRef.current(), remainingRef.current)
  }

  if (!open) return null

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[60] flex justify-center px-4 sm:justify-end sm:pr-5">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-xl card-frame animate-[toast-in_180ms_ease-out]"
        onMouseEnter={pauseTimer}
        onMouseLeave={resumeTimer}
      >
        <div className="flex items-center gap-2 bg-white px-3 py-2">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-600">{title}</p>
          {actionLabel != null && onAction != null && (
            <button
              type="button"
              onClick={onAction}
              className="shrink-0 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              {actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded px-1 text-base leading-none text-ink-400 hover:bg-ink-50 hover:text-ink-700"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
        {children != null && (
          <div className="space-y-1 border-t border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-800">
            {children}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
