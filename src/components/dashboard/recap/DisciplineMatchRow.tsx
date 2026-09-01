import type { DisciplineMatchRecap } from '../../../lib/tournamentRecap'
import { formatDisplayDate } from '../../../lib/formatDate'
import { OpponentNoteButton } from '../../notes/OpponentNoteButton'
import { MatchHighlightChip } from './MatchHighlightChip'

type Props = {
  match: DisciplineMatchRecap
  /** When false, hide Big upset chips (build stage < 7). */
  showMatchHighlights?: boolean
  /** When false, hide opponent notes icon (build stage < 10). */
  showNotes?: boolean
}

function OpponentNames({ match }: { match: DisciplineMatchRecap }) {
  if (match.opponentMembers.length === 0) {
    return <>{match.opponents}</>
  }

  return (
    <>
      {match.opponentMembers.map((member, index) => (
        <span key={`${member.name}-${index}`}>
          {index > 0 && <span className="text-ink-400"> & </span>}
          {member.name}
          {member.rating != null && (
            <span className="font-normal tabular-nums text-ink-500">
              {' '}
              ({member.rating})
            </span>
          )}
        </span>
      ))}
    </>
  )
}

export function DisciplineMatchRow({
  match,
  showMatchHighlights = true,
  showNotes = true,
}: Props) {
  const outcomeLabel =
    match.outcome === 'win' ? 'Win' : match.outcome === 'loss' ? 'Loss' : null

  return (
    <li className="border-b border-ink-100/80 py-1.5 last:border-b-0">
      <div className="grid grid-cols-[1fr_auto] items-start gap-x-2 gap-y-0.5">
        <div className="min-w-0">
          {(match.showDate || match.roundLabel) && (
            <p className="text-[10px] text-ink-500">
              {match.showDate ? formatDisplayDate(match.date) : null}
              {match.showDate && match.roundLabel ? (
                <>
                  <span aria-hidden className="text-ink-300">
                    {' '}
                    ·{' '}
                  </span>
                  <span className="italic">{match.roundLabel}</span>
                </>
              ) : match.roundLabel ? (
                <span className="italic">{match.roundLabel}</span>
              ) : null}
            </p>
          )}
          <p className="break-words text-sm font-medium leading-snug text-ink-900">
            vs <OpponentNames match={match} />
          </p>
          {match.showPartnerName && match.partnerName && (
            <p className="break-words text-xs leading-snug text-ink-600">
              with {match.partnerName}
              {match.partnerRating != null && (
                <span className="tabular-nums text-ink-500">
                  {' '}
                  ({match.partnerRating})
                </span>
              )}
            </p>
          )}
          <p className="text-xs text-ink-500">
            {outcomeLabel != null && (
              <span
                className={
                  match.outcome === 'win'
                    ? 'font-medium text-gain-700'
                    : 'font-medium text-loss-700'
                }
              >
                {outcomeLabel}
                {match.scoreSummary ? ' · ' : ''}
              </span>
            )}
            {match.scoreSummary || '—'}
          </p>
        </div>
        {(showNotes || (showMatchHighlights && match.highlights.length > 0)) && (
          <div className="flex shrink-0 items-center justify-end gap-1 self-start pt-0.5">
            {showMatchHighlights &&
              match.highlights.map((highlight) => (
                <MatchHighlightChip key={highlight.id} highlight={highlight} />
              ))}
            {showNotes && <OpponentNoteButton context={match.noteContext} />}
          </div>
        )}
      </div>
    </li>
  )
}
