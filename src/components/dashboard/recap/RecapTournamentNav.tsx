type Props = {
  positionLabel: string
  canGoOlder: boolean
  canGoNewer: boolean
  onOlder: () => void
  onNewer: () => void
  /** Mock: quiet corner mark when older recaps since subscribe are still unviewed. */
  hasUnviewedOlder?: boolean
}

export function RecapTournamentNav({
  positionLabel,
  canGoOlder,
  canGoNewer,
  onOlder,
  onNewer,
  hasUnviewedOlder = false,
}: Props) {
  const showUnviewedMark = hasUnviewedOlder && canGoOlder

  return (
    <div className="flex min-h-[2.75rem] flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={onOlder}
        disabled={!canGoOlder}
        aria-label={showUnviewedMark ? 'Older, unviewed recaps' : 'Older'}
        className="relative rounded-lg border border-ink-100 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 shadow-sm transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← Older
        {showUnviewedMark ? (
          <span
            className="absolute -top-px -right-px h-2 w-2 translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400 ring-2 ring-white"
            aria-hidden
          />
        ) : null}
      </button>
      <span className="text-sm text-ink-600">{positionLabel}</span>
      <button
        type="button"
        onClick={onNewer}
        disabled={!canGoNewer}
        className="rounded-lg border border-ink-100 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 shadow-sm transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Newer →
      </button>
    </div>
  )
}
