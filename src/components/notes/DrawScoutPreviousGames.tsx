import type { DrawScoutResultMatch } from '../../lib/drawScoutMatches'
import {
  MATCH_SCOREBOARD_GRID,
  MatchScoreboardRow,
} from '../match/MatchScoreboardRow'

type Props = {
  opponentName: string
  items: DrawScoutResultMatch[]
  className?: string
  /**
   * When false (viewing someone else’s draw), used only for accessible labelling
   * so history is clearly the viewer’s, not the entrant’s.
   */
  viewingOwnDraw?: boolean
}

/**
 * Previous meetings list for the Draw Scout games panel (tabs handle show/hide).
 */
export function DrawScoutPreviousGames({
  opponentName,
  items,
  className = '',
  viewingOwnDraw = true,
}: Props) {
  if (items.length === 0) return null

  return (
    <ul
      className={`divide-y divide-ink-100 ${className}`}
      aria-label={
        viewingOwnDraw
          ? `Your games against ${opponentName}`
          : `Games you've played against ${opponentName}`
      }
    >
      {items.map(({ match, isNoteMatch }) => (
        <li
          key={`${match.date}-${match.competitionName}-${match.opponents}-${match.discipline}`}
          className="py-2 first:pt-0 last:pb-0"
        >
          {isNoteMatch && (
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-notes-amber-ink">
              Note from this game
            </p>
          )}
          <ul className={MATCH_SCOREBOARD_GRID}>
            <MatchScoreboardRow match={match} />
          </ul>
        </li>
      ))}
    </ul>
  )
}
