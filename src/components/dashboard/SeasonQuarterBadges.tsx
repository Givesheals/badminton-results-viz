import { useCallback, useEffect, useRef, useState } from 'react'
import type { SeasonQuarterDisplayState, SeasonQuarterJourney } from '../../lib/seasonJourney'

const CLAIM_ANIMATION_MS = 650

type Props = {
  quarters: SeasonQuarterJourney[]
  onClaim: (quarterKey: string) => void
}

type SummaryStatus = 'tick' | 'cross' | 'claimable' | 'pending' | 'future'

function monthRangeFromLabel(label: string): string {
  return label.replace(/^Q\d+\s·\s/, '').replace(/\s+\d{4}$/, '')
}

function summaryStatus(displayState: SeasonQuarterDisplayState): SummaryStatus {
  switch (displayState) {
    case 'claimed':
      return 'tick'
    case 'closed':
      return 'cross'
    case 'ready_to_claim':
      return 'claimable'
    case 'in_progress':
      return 'pending'
    default:
      return 'future'
  }
}

function isExpanded(quarter: SeasonQuarterJourney): boolean {
  return quarter.displayState === 'in_progress' && quarter.phase === 'active'
}

export function SeasonQuarterBadges({ quarters, onClaim }: Props) {
  const [claimingKey, setClaimingKey] = useState<string | null>(null)
  const [celebratingKey, setCelebratingKey] = useState<string | null>(null)
  const claimTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (claimTimeoutRef.current != null) {
        window.clearTimeout(claimTimeoutRef.current)
      }
    }
  }, [])

  const handleClaim = useCallback(
    (quarterKey: string) => {
      if (claimingKey) return

      setClaimingKey(quarterKey)
      if (claimTimeoutRef.current != null) {
        window.clearTimeout(claimTimeoutRef.current)
      }

      claimTimeoutRef.current = window.setTimeout(() => {
        onClaim(quarterKey)
        setClaimingKey(null)
        setCelebratingKey(quarterKey)
        claimTimeoutRef.current = window.setTimeout(() => {
          setCelebratingKey(null)
          claimTimeoutRef.current = null
        }, 450)
      }, CLAIM_ANIMATION_MS)
    },
    [claimingKey, onClaim],
  )

  const activeIndex = quarters.findIndex((q) => q.phase === 'active')
  const expandedQuarters = quarters.filter((quarter) => isExpanded(quarter))

  return (
    <div className="space-y-4">
      <div aria-label="Quarter timeline">
        <div className="grid grid-cols-4 gap-1">
          {quarters.map((quarter) => (
            <div key={`head-${quarter.key}`} className="text-center">
              <p className="text-xs font-semibold text-ink-900">{quarter.shortLabel}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-ink-500">
                {monthRangeFromLabel(quarter.label)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-4 gap-1">
          {quarters.map((quarter) => (
            <div key={`status-${quarter.key}`} className="flex justify-center">
              {quarter.key === claimingKey ? (
                <ClaimingSummaryIcon />
              ) : (
                <SummaryIcon
                  status={summaryStatus(quarter.displayState)}
                  celebrate={quarter.key === celebratingKey}
                  quarterKey={quarter.key}
                  shortLabel={quarter.shortLabel}
                  onClaim={handleClaim}
                />
              )}
            </div>
          ))}
        </div>

        <div className="relative mt-1 grid grid-cols-4 gap-1">
          {quarters.map((quarter, index) => (
            <div key={`now-${quarter.key}`} className="flex justify-center">
              {index === activeIndex && (
                <div className="flex flex-col items-center">
                  <span className="text-[10px] leading-none text-brand-600">▲</span>
                  <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                    Now
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {expandedQuarters.length > 0 && (
        <div className="space-y-2" role="list" aria-label="Quarter details">
          {expandedQuarters.map((quarter) => (
            <QuarterCardExpanded key={quarter.key} quarter={quarter} />
          ))}
        </div>
      )}
    </div>
  )
}

function ClaimingSummaryIcon() {
  return (
    <span
      className="relative flex h-6 w-6 items-center justify-center"
      aria-label="Claiming quarter"
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-full border-2 border-brand-400 animate-quarter-claim-ring"
        aria-hidden
      />
      <span
        className="absolute flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-sm font-bold leading-none text-brand-700 animate-quarter-question-out"
        aria-hidden
      >
        ?
      </span>
      <span
        className="absolute text-base font-bold leading-none text-brand-600 animate-quarter-tick-in"
        aria-hidden
      >
        ✓
      </span>
    </span>
  )
}

function SummaryIcon({
  status,
  celebrate = false,
  quarterKey,
  shortLabel,
  onClaim,
}: {
  status: SummaryStatus
  celebrate?: boolean
  quarterKey: string
  shortLabel: string
  onClaim: (quarterKey: string) => void
}) {
  if (status === 'tick') {
    return (
      <span
        className={`inline-block text-base leading-none text-brand-600 ${
          celebrate ? 'animate-quarter-tick-celebrate' : ''
        }`}
        aria-label="Claimed"
      >
        ✓
      </span>
    )
  }

  if (status === 'cross') {
    return (
      <span className="text-base leading-none text-ink-400" aria-label="Not completed">
        ✗
      </span>
    )
  }

  if (status === 'claimable') {
    return (
      <button
        type="button"
        className="rounded-full transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
        aria-label={`Claim ${shortLabel} quarter`}
        onClick={() => onClaim(quarterKey)}
      >
        <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-sm font-bold leading-none text-brand-700 ring-2 ring-brand-300">
          <span
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-brand-400 animate-quarter-claim-ring"
            aria-hidden
          />
          <span className="animate-milestone-claim-wobble" aria-hidden>
            ?
          </span>
        </span>
      </button>
    )
  }

  if (status === 'pending') {
    return (
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-brand-300 text-[10px] leading-none text-brand-500"
        aria-label="In progress"
      >
        ·
      </span>
    )
  }

  return (
    <span className="text-sm leading-none text-ink-300" aria-label="Upcoming">
      —
    </span>
  )
}

function QuarterCardExpanded({ quarter }: { quarter: SeasonQuarterJourney }) {
  const { tournamentCount, threshold } = quarter
  const progress = Math.min(1, tournamentCount / threshold)
  const range = monthRangeFromLabel(quarter.label)

  return (
    <div
      role="listitem"
      className="origin-center overflow-hidden rounded-xl border border-brand-300 bg-white p-4 shadow-sm ring-2 ring-brand-200"
      aria-label={`${quarter.shortLabel} ${range} — ${tournamentCount} of ${threshold} tournaments`}
    >
      <p className="text-sm font-semibold text-ink-900">
        {quarter.shortLabel} · {range}
      </p>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-sm tabular-nums text-ink-700">
          {tournamentCount}/{threshold}
        </span>
      </div>
    </div>
  )
}
