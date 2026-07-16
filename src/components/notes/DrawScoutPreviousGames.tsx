import { useState } from 'react'
import { formatGamesPlayedLabel } from '../../lib/drawScout'
import type { DrawScoutResultMatch } from '../../lib/drawScoutMatches'
import { MatchScoreboardRow } from '../match/MatchScoreboardRow'

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 text-ink-500 transition ${open ? 'rotate-180' : ''}`}
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

type Props = {
  opponentName: string
  items: DrawScoutResultMatch[]
  className?: string
  /** When true (e.g. matchup has history but no notes), open immediately. */
  defaultOpen?: boolean
  /** When false, prefix the summary with “No notes” so empty scouting is obvious. */
  hasNotes?: boolean
  /**
   * When false (viewing someone else’s draw), used only for accessible labelling
   * so history is clearly the viewer’s, not the entrant’s.
   */
  viewingOwnDraw?: boolean
}

/**
 * Collapsed-by-default previous meetings. Flat full-width toggle — no nested
 * card or indent, so it stays aligned with the note content above.
 */
export function DrawScoutPreviousGames({
  opponentName,
  items,
  className = '',
  defaultOpen = false,
  hasNotes = true,
  viewingOwnDraw = true,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)
  if (items.length === 0) return null

  const gamesLabel = formatGamesPlayedLabel(items.length) ?? 'Your games: 0'
  const summary = hasNotes ? gamesLabel : `No notes · ${gamesLabel}`

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 py-1 text-left text-xs font-medium text-ink-700 transition hover:text-ink-900"
      >
        <span className="min-w-0 flex-1">{summary}</span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <ul
          className="divide-y divide-ink-100"
          aria-label={
            viewingOwnDraw
              ? `Your games against ${opponentName}`
              : `Games you've played against ${opponentName}`
          }
        >
          {items.map(({ match, isNoteMatch }) => (
            <li
              key={`${match.date}-${match.competitionName}-${match.opponents}-${match.discipline}`}
              className="py-2"
            >
              {isNoteMatch && (
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-brand-700">
                  Note from this game
                </p>
              )}
              <ul className="grid grid-cols-[max-content_minmax(0,1fr)_minmax(3.25rem,max-content)_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1">
                <MatchScoreboardRow match={match} />
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
