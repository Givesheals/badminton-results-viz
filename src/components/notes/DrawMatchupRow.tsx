import type { ReactNode } from 'react'
import type { MatchupIntelTeaser } from '../../lib/drawScout'
import type { DrawMatchup, DrawPlayer } from '../../lib/drawTypes'

export const DRAW_MATCHUP_GRID =
  'grid grid-cols-[5rem_1fr_1fr] items-start gap-x-3 gap-y-1.5'

const DRAW_SIDES_GRID = 'grid grid-cols-2 items-start gap-x-3 gap-y-1.5'

function PlayerNames({ players }: { players: DrawPlayer[] }) {
  return (
    <div className="space-y-0.5">
      {players.map((player, index) => (
        <div key={player.name} className="text-sm leading-snug text-ink-900">
          {player.seedLabel && (
            <span className="mr-1 font-semibold text-ink-500">{player.seedLabel}</span>
          )}
          {player.name}
          {index < players.length - 1 && <span className="text-ink-400"> &</span>}
        </div>
      ))}
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-ink-500 transition ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function MatchupIntelTeaserLine({ teaser }: { teaser: MatchupIntelTeaser }) {
  const showDot = teaser.notesCta != null && teaser.gamesLabel != null

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
      {teaser.notesCta != null && (
        <span className="inline-flex items-center rounded-md bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-800">
          {teaser.notesCta}
        </span>
      )}
      {showDot && (
        <span className="text-sm text-ink-300" aria-hidden>
          ·
        </span>
      )}
      {teaser.gamesLabel != null && (
        <span className="text-sm text-ink-500">{teaser.gamesLabel}</span>
      )}
    </div>
  )
}

type ExpandableProps = {
  open: boolean
  onToggle: () => void
  /** Always-visible collapsed teaser (notes pill and/or games label). */
  teaser: MatchupIntelTeaser
}

type Props = {
  matchup: DrawMatchup
  /** When set, uses the three-column draw-email layout with a round label column. */
  label?: string
  /** Expanded content under the matchup (notes / history). */
  notes?: ReactNode
  /** When set, the whole matchup row toggles expand/collapse. */
  expandable?: ExpandableProps
}

/**
 * Draw matchup row. Default: two columns (your side | opponents). With `label`,
 * adds the round column used in draw-out email previews.
 */
export function DrawMatchupRow({ label, matchup, notes, expandable }: Props) {
  const sides =
    label != null ? (
      <>
        <p className="text-xs font-medium text-ink-500">{label}</p>
        <PlayerNames players={matchup.yourSide} />
        <PlayerNames players={matchup.opponentSide} />
      </>
    ) : (
      <>
        <PlayerNames players={matchup.yourSide} />
        <PlayerNames players={matchup.opponentSide} />
      </>
    )

  const gridClass = label != null ? DRAW_MATCHUP_GRID : DRAW_SIDES_GRID
  const notesSpan = label != null ? 'col-span-3' : 'col-span-2'

  if (expandable != null) {
    return (
      <div className="border-t border-ink-100 py-2 first:border-t-0 first:pt-0">
        <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-sm">
          <button
            type="button"
            onClick={expandable.onToggle}
            aria-expanded={expandable.open}
            className="flex w-full items-stretch gap-2 text-left transition hover:bg-ink-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-200"
          >
            <div className="min-w-0 flex-1 px-3 py-3">
              <div className={gridClass}>{sides}</div>
              <MatchupIntelTeaserLine teaser={expandable.teaser} />
            </div>
            <span
              className="flex w-11 shrink-0 items-center justify-center border-l border-ink-100 bg-ink-50/70"
              aria-hidden
            >
              <ChevronIcon open={expandable.open} />
            </span>
          </button>
          {expandable.open && notes != null && (
            <div className="space-y-2 border-t border-ink-100 bg-ink-50/40 px-3 py-3">{notes}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`${gridClass} border-t border-ink-100 py-3 first:border-t-0`}>
      {sides}
      {notes != null && <div className={`${notesSpan} space-y-2`}>{notes}</div>}
    </div>
  )
}
