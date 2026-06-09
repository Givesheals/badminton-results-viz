type Props = {
  positionLabel: string
  canGoOlder: boolean
  canGoNewer: boolean
  onOlder: () => void
  onNewer: () => void
}

export function RecapTournamentNav({
  positionLabel,
  canGoOlder,
  canGoNewer,
  onOlder,
  onNewer,
}: Props) {
  return (
    <div className="flex min-h-[2.75rem] flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={onOlder}
        disabled={!canGoOlder}
        className="rounded-lg border border-ink-100 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 shadow-sm transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← Previous
      </button>
      <span className="text-sm text-ink-600">{positionLabel}</span>
      <button
        type="button"
        onClick={onNewer}
        disabled={!canGoNewer}
        className="rounded-lg border border-ink-100 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 shadow-sm transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  )
}
