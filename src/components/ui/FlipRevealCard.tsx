import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  fireConfettiBurst,
  type ConfettiIntensity,
} from '../../lib/confettiBurst'

type Phase = 'sealed' | 'shaking' | 'flipping' | 'revealed'

type Props = {
  children: ReactNode
  /** Celebration size after flip — better results = more confetti. */
  intensity?: ConfettiIntensity
  /** Accessible name for the sealed card button. */
  revealLabel?: string
  /** Optional short line under “Reveal”. */
  sealedHint?: string
  /** Start already open (e.g. screenshots / reduced experimentation). */
  startRevealed?: boolean
  /** Compact supporting cards use a slim mystery back so they don't dominate. */
  size?: 'hero' | 'compact'
  className?: string
}

const SHAKE_MS = 480
const FLIP_MS = 700

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function MysteryBack({
  hint,
  compact,
}: {
  hint?: string
  compact?: boolean
}) {
  if (compact) {
    return (
      <div className="flip-reveal-mystery relative flex h-full min-h-[3.25rem] items-center justify-center gap-2 overflow-hidden rounded-lg px-3 py-2">
        <div className="flip-reveal-shimmer pointer-events-none absolute inset-0" aria-hidden />
        <span
          className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-sm shadow-inner ring-1 ring-white/25"
          aria-hidden
        >
          ?
        </span>
        <p className="relative z-10 text-sm font-bold tracking-wide text-white drop-shadow-sm">
          Reveal
        </p>
        {hint && (
          <p className="relative z-10 hidden text-xs text-white/80 sm:block">{hint}</p>
        )}
      </div>
    )
  }

  return (
    <div className="flip-reveal-mystery relative flex h-full min-h-[11.5rem] flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl px-4 py-6 text-center">
      <div className="flip-reveal-shimmer pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-10 flex flex-col items-center gap-2">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-3xl shadow-inner ring-1 ring-white/25"
          aria-hidden
        >
          ?
        </span>
        <span className="text-2xl opacity-90" aria-hidden>
          🔒
        </span>
        <p className="text-lg font-bold tracking-wide text-white drop-shadow-sm">Reveal</p>
        {hint && <p className="max-w-[14rem] text-xs text-white/80">{hint}</p>}
      </div>
    </div>
  )
}

/**
 * Sealed “mystery” face that shakes, flips, then shows children + confetti.
 * Built from common CSS 3D flip + canvas-confetti (Magic UI–style building blocks).
 */
export function FlipRevealCard({
  children,
  intensity = 'medium',
  revealLabel = 'Reveal result',
  sealedHint = 'Tap to flip this result card',
  startRevealed = false,
  size = 'hero',
  className = '',
}: Props) {
  const labelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>(startRevealed ? 'revealed' : 'sealed')
  const timersRef = useRef<number[]>([])

  const clearTimers = () => {
    for (const id of timersRef.current) window.clearTimeout(id)
    timersRef.current = []
  }

  useEffect(() => () => clearTimers(), [])

  const finishReveal = () => {
    setPhase('revealed')
    fireConfettiBurst(rootRef.current, intensity)
  }

  const handleReveal = () => {
    if (phase !== 'sealed') return

    if (prefersReducedMotion()) {
      finishReveal()
      return
    }

    clearTimers()
    setPhase('shaking')
    const toFlip = window.setTimeout(() => {
      setPhase('flipping')
      const toDone = window.setTimeout(() => {
        finishReveal()
      }, FLIP_MS)
      timersRef.current.push(toDone)
    }, SHAKE_MS)
    timersRef.current.push(toFlip)
  }

  if (phase === 'revealed') {
    return <div className={className}>{children}</div>
  }

  const isFlipping = phase === 'flipping'
  const isShaking = phase === 'shaking'
  const compact = size === 'compact'
  const minHeightClass = compact ? 'min-h-[3.25rem]' : 'min-h-[11.5rem]'
  const backRadiusClass = compact ? 'rounded-lg' : 'rounded-2xl'

  return (
    <div
      ref={rootRef}
      className={`flip-reveal-root isolate overflow-hidden perspective-[1200px] ${className}`}
    >
      <button
        type="button"
        aria-labelledby={labelId}
        aria-expanded={false}
        disabled={phase !== 'sealed'}
        onClick={handleReveal}
        className={`group relative w-full cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-default ${
          isShaking ? 'flip-reveal-shake' : ''
        } ${isFlipping ? 'flip-reveal-lift' : ''}`}
      >
        <span id={labelId} className="sr-only">
          {revealLabel}
        </span>
        <div
          className={`flip-reveal-inner relative w-full ${minHeightClass} ${
            isFlipping ? 'is-flipped' : ''
          }`}
        >
          <div className="flip-reveal-face flip-reveal-face-front absolute inset-0">
            <MysteryBack hint={sealedHint} compact={compact} />
          </div>
          <div
            className={`flip-reveal-face flip-reveal-face-back absolute inset-0 overflow-hidden ${backRadiusClass}`}
          >
            <div className={`h-full ${minHeightClass}`}>{children}</div>
          </div>
        </div>
      </button>
    </div>
  )
}
