import type { ReactNode } from 'react'
import type { MatchupIntelTeaser } from '../../lib/drawScout'
import type { DrawMatchup, DrawPlayer } from '../../lib/drawTypes'
import { getDisciplineStyle } from '../../lib/disciplineStyle'

export const DRAW_MATCHUP_GRID =
  'grid grid-cols-[5rem_1fr_1fr] items-start gap-x-3 gap-y-1.5'

const DRAW_SIDES_GRID = 'grid grid-cols-2 items-start gap-x-3 gap-y-1.5'

/** Reserves space so games never slide into the notes badge slot. */
const NOTES_BADGE_SLOT = 'inline-flex min-h-[1.375rem] min-w-[5.75rem] items-center'

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
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className={NOTES_BADGE_SLOT}>
        {teaser.notesCta != null ? (
          <span className="inline-flex items-center rounded-md border border-notes-amber/35 bg-notes-amber-soft px-2 py-0.5 text-xs font-semibold text-notes-amber-ink">
            {teaser.notesCta}
          </span>
        ) : null}
      </span>
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
  /** Discipline for the header-only left edge accent. */
  disciplineCode?: string
}

/**
 * Draw matchup row. Default: two columns (your side | opponents). With `label`,
 * adds the round column used in draw-out email previews.
 */
export function DrawMatchupRow({
  label,
  matchup,
  notes,
  expandable,
  disciplineCode,
}: Props) {
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
  const disciplineStyle = getDisciplineStyle(disciplineCode ?? '')

  // Shared card chrome for expandable and static (no-intel) matchups.
  const cardShell =
    'overflow-hidden rounded-xl border border-ink-100 bg-white shadow-sm'

  if (expandable != null) {
    return (
      <div className="border-t border-ink-100 py-2 first:border-t-0 first:pt-0">
        <div className={cardShell}>
          <button
            type="button"
            onClick={expandable.onToggle}
            aria-expanded={expandable.open}
            className={`flex w-full items-stretch gap-2 rounded-r border-l-4 text-left transition hover:bg-ink-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-200 ${disciplineStyle.borderClass}`}
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

  // Static card: same shell + discipline edge, no chevron / hover (not expandable).
  return (
    <div className="border-t border-ink-100 py-2 first:border-t-0 first:pt-0">
      <div className={cardShell}>
        <div
          className={`rounded-r border-l-4 px-3 py-3 ${disciplineStyle.borderClass}`}
        >
          <div className={gridClass}>{sides}</div>
          <p className="mt-2 text-xs text-ink-400">No notes or games yet</p>
          {notes != null && <div className={`${notesSpan} mt-2 space-y-2`}>{notes}</div>}
        </div>
      </div>
    </div>
  )
}
