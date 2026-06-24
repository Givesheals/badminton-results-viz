import type { DisciplineMatchRecap } from '../../../lib/tournamentRecap'
import { formatDisplayDate } from '../../../lib/formatDate'
import { OpponentNoteButton } from '../../notes/OpponentNoteButton'
import { MatchHighlightChip } from './MatchHighlightChip'

type Props = {
  match: DisciplineMatchRecap
}

export function DisciplineMatchRow({ match }: Props) {
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
          <p className="truncate text-sm font-medium text-ink-900" title={match.opponents}>
            vs {match.opponents}
          </p>
          {match.showPartnerName && match.partnerName && (
            <p className="truncate text-xs text-ink-600" title={`Partner: ${match.partnerName}`}>
              with {match.partnerName}
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
        <div className="flex shrink-0 flex-col items-end gap-1 self-center">
          {match.highlights.length > 0 && (
            <div className="flex max-w-[9.5rem] flex-col items-end gap-1">
              {match.highlights.map((highlight) => (
                <MatchHighlightChip key={highlight.id} highlight={highlight} />
              ))}
            </div>
          )}
          <OpponentNoteButton context={match.noteContext} />
        </div>
      </div>
    </li>
  )
}
