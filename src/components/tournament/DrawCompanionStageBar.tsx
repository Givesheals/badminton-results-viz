import type { TournamentPageVisibility } from '../../lib/tournamentPageMockData'

export type TournamentPageStage = 'Entries' | 'Groups' | 'Finals' | 'Companion'

type Props = {
  visibility: TournamentPageVisibility
  selectedStage: TournamentPageStage
  onSelectStage: (stage: TournamentPageStage) => void
}

/** Compact crown mark for the Premium / gift Companion stage chip. */
function CrownIcon({ className = 'h-3.5 w-3.5 text-amber-500' }: { className?: string }) {
  return (
    <svg
      className={`shrink-0 ${className}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path d="M2.5 14.5h15l-1.2-7.2a.75.75 0 00-1.22-.42L12 9.5 10.42 5.3a.75.75 0 00-1.34 0L7.5 9.5 4.42 6.88a.75.75 0 00-1.22.42L2.5 14.5zM3 16a1 1 0 001 1h12a1 1 0 001-1v-.5H3V16z" />
    </svg>
  )
}

function stageChipClass(selected: boolean) {
  return `rounded-full px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 ${
    selected
      ? 'border border-ink-900 bg-ink-200 text-ink-900'
      : 'bg-ink-100 text-brand-700 hover:bg-ink-200'
  }`
}

/**
 * Tournament page stage bar. When the visitor can see Draw companion (Premium or gift),
 * a Companion chip sits alongside Entries / Groups / Finals and swaps page content inline.
 */
export function DrawCompanionStageBar({
  visibility,
  selectedStage,
  onSelectStage,
}: Props) {
  const showCompanion = visibility !== 'hidden'

  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Stage">
      <span className="text-sm font-medium text-brand-700">Stage:</span>
      {(['Entries', 'Groups', 'Finals'] as const).map((stage) => {
        const selected = selectedStage === stage
        return (
          <button
            key={stage}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelectStage(stage)}
            className={stageChipClass(selected)}
          >
            {stage}
          </button>
        )
      })}
      {showCompanion && (
        <button
          type="button"
          role="tab"
          aria-selected={selectedStage === 'Companion'}
          onClick={() => onSelectStage('Companion')}
          className={`inline-flex items-center gap-1 ${stageChipClass(selectedStage === 'Companion')}`}
          aria-label="Draw companion"
          title="Draw companion"
        >
          Companion
          <CrownIcon />
        </button>
      )}
    </div>
  )
}
