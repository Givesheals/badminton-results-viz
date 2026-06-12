import type { DisciplineMatchRecap } from '../../../lib/tournamentRecap'
import { formatDisplayDate } from '../../../lib/formatDate'
import { MatchHighlightChip } from './MatchHighlightChip'

type Props = {
  match: DisciplineMatchRecap
}

export function DisciplineMatchRow({ match }: Props) {
  const outcomeLabel =
    match.outcome === 'win' ? 'Win' : match.outcome === 'loss' ? 'Loss' : null

  return (
    <li className="border-b border-ink-100/80 py-1.5 last:border-b-0">
      <div
        className={
          match.highlights.length > 0
            ? 'grid grid-cols-[1fr_auto] items-start gap-x-2 gap-y-0.5'
            : undefined
        }
      >
        <div className="min-w-0">
          <p className="text-[10px] text-ink-500">
            {formatDisplayDate(match.date)}
            {match.roundLabel ? (
              <>
                <span aria-hidden className="text-ink-300">
                  {' '}
                  ·{' '}
                </span>
                <span className="italic">{match.roundLabel}</span>
              </>
            ) : null}
          </p>
          <p className="truncate text-sm font-medium text-ink-900" title={match.opponents}>
            vs {match.opponents}
          </p>
          {match.partnerName && (
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
        {match.highlights.length > 0 && (
          <div className="flex max-w-[9.5rem] shrink-0 flex-col items-end gap-1 self-center">
            {match.highlights.map((highlight) => (
              <MatchHighlightChip key={highlight.id} highlight={highlight} />
            ))}
          </div>
        )}
      </div>
    </li>
  )
}
