import { formatMatchDateShort, type OpponentNoteMatchContext } from '../../lib/opponentNotes'
import type { NormalizedMatch } from '../../types/matchHistory'
import { DisciplineChip } from '../discipline/DisciplineChip'
import { MatchScoreboardRow } from '../match/MatchScoreboardRow'
import { TournamentCategoryChip } from '../tournament/TournamentCategoryChip'

type Props = {
  context: OpponentNoteMatchContext
  match: NormalizedMatch | null
}

function MatchMetaChips({
  categoryLabel,
  discipline,
  disciplineLabel,
  roundLabel,
}: {
  categoryLabel: string | null
  discipline: string
  disciplineLabel: string
  roundLabel: string | null
}) {
  const hasCategory = categoryLabel != null && categoryLabel !== ''
  const hasRound = roundLabel != null && roundLabel !== ''

  return (
    <>
      {hasCategory && <TournamentCategoryChip label={categoryLabel} />}
      <DisciplineChip code={discipline} title={disciplineLabel} />
      {hasRound && (
        <span className="text-[10px] font-medium uppercase tracking-wide text-ink-500">
          {roundLabel}
        </span>
      )}
    </>
  )
}

export function OpponentNoteMatchFooter({ context, match }: Props) {
  const categoryLabel =
    match?.tournamentCategoryLabel ?? context.tournamentCategoryLabel ?? null

  const metaChips = (
    <MatchMetaChips
      categoryLabel={categoryLabel}
      discipline={context.discipline}
      disciplineLabel={context.disciplineLabel}
      roundLabel={context.roundLabel}
    />
  )

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-ink-100 bg-ink-50/40">
      {match != null ? (
        <ul className="grid grid-cols-1 p-2">
          <MatchScoreboardRow
            match={match}
            variant="stack"
            titleMeta={metaChips}
            showDisciplineChip={false}
          />
        </ul>
      ) : (
        <div className="px-2.5 py-2">
          <p
            className="truncate text-sm font-medium text-ink-900"
            title={context.competitionName}
          >
            {context.competitionName}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">{metaChips}</div>
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
