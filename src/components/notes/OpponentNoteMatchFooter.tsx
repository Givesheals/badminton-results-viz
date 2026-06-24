import { formatMatchDateShort, type OpponentNoteMatchContext } from '../../lib/opponentNotes'
import type { NormalizedMatch } from '../../types/matchHistory'
import { DisciplineChip } from '../discipline/DisciplineChip'
import { MatchScoreboardRow } from '../match/MatchScoreboardRow'
import { TournamentCategoryChip } from '../tournament/TournamentCategoryChip'

type Props = {
  context: OpponentNoteMatchContext
  match: NormalizedMatch | null
}

export function OpponentNoteMatchFooter({ context, match }: Props) {
  const categoryLabel =
    match?.tournamentCategoryLabel ?? context.tournamentCategoryLabel ?? null

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-ink-100 bg-ink-50/40">
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 bg-white px-2.5 py-2">
        {categoryLabel != null && categoryLabel !== '' && (
          <TournamentCategoryChip label={categoryLabel} />
        )}
        <DisciplineChip code={context.discipline} title={context.disciplineLabel} />
        {context.roundLabel != null && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-ink-500">
            {context.roundLabel}
          </span>
        )}
      </div>

      {match != null ? (
        <ul className="grid grid-cols-[max-content_minmax(0,1fr)_minmax(3.25rem,max-content)_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1 p-2">
          <MatchScoreboardRow match={match} />
        </ul>
      ) : (
        <div className="px-2.5 py-2">
          <p
            className="truncate text-sm font-medium text-ink-900"
            title={context.competitionName}
          >
            {context.competitionName}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">{formatMatchDateShort(context.date)}</p>
          <p className="mt-1 text-xs text-ink-600">
            vs {context.opponentsDisplay}
            {context.partnerName ? ` · with ${context.partnerName}` : ''}
            {context.outcome === 'win' || context.outcome === 'loss' ? (
              <>
                {' '}
                ·{' '}
                <span
                  className={
                    context.outcome === 'win' ? 'font-medium text-gain-700' : 'font-medium text-loss-700'
                  }
                >
                  {context.outcome === 'win' ? 'Win' : 'Loss'} {context.scoreSummary}
                </span>
              </>
            ) : (
              context.scoreSummary ? ` · ${context.scoreSummary}` : null
            )}
          </p>
        </div>
      )}
    </div>
  )
}
