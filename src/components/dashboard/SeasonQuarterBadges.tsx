import type { SeasonQuarterJourney } from '../../lib/seasonJourney'

type Props = {
  quarters: SeasonQuarterJourney[]
  onClaim: (quarterKey: string) => void
}

export function SeasonQuarterBadges({ quarters, onClaim }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {quarters.map((quarter) => (
        <QuarterTile key={quarter.key} quarter={quarter} onClaim={onClaim} />
      ))}
    </div>
  )
}

function QuarterTile({
  quarter,
  onClaim,
}: {
  quarter: SeasonQuarterJourney
  onClaim: (quarterKey: string) => void
}) {
  const { displayState, tournamentCount, threshold } = quarter
  const progress = Math.min(1, tournamentCount / threshold)
  const canClaim = displayState === 'ready_to_claim'

  const frameClass =
    displayState === 'claimed'
      ? 'border-brand-300 bg-gradient-to-br from-brand-50 to-white ring-1 ring-brand-200'
      : displayState === 'ready_to_claim'
        ? 'border-brand-400 bg-brand-50/80 ring-2 ring-brand-200 animate-pulse'
        : displayState === 'closed'
          ? 'border-ink-200 bg-ink-50/80'
          : displayState === 'future'
            ? 'border-ink-100 bg-ink-50/50'
            : 'border-ink-100 bg-white'

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-4 shadow-sm transition ${frameClass}`}
    >
      {displayState === 'claimed' && (
        <span
          className="pointer-events-none absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs text-white shadow"
          aria-hidden
        >
          ✓
        </span>
      )}

      <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">
        {quarter.shortLabel}
      </p>
      <p className="mt-0.5 text-sm font-medium text-ink-900">{quarter.label}</p>

      {displayState === 'future' ? (
        <p className="mt-3 text-sm text-ink-500">Coming soon</p>
      ) : displayState === 'claimed' ? (
        <p className="mt-3 text-sm font-medium text-brand-700">{quarter.claimMessage}</p>
      ) : displayState === 'closed' ? (
        <>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-ink-300 transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-ink-600">
            {tournamentCount} / {threshold} tournaments
          </p>
          <p className="mt-2 text-sm text-ink-700">{quarter.closedMessage}</p>
        </>
      ) : (
        <>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-ink-700">
            {tournamentCount} / {threshold} tournaments
          </p>
          {displayState === 'in_progress' && (
            <p className="mt-1 text-xs text-ink-500">Keep building your quarter</p>
          )}
        </>
      )}

      {canClaim && (
        <button
          type="button"
          onClick={() => onClaim(quarter.key)}
          className="mt-3 w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
        >
          Claim
        </button>
      )}
    </div>
  )
}
