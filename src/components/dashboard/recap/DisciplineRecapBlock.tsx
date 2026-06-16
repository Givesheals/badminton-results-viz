import type { DisciplineRecap } from '../../../lib/tournamentRecap'
import { getDisciplineStyle } from '../../../lib/disciplineStyle'
import { formatWinLossRecord } from '../../../lib/formatNumbers'
import {
  PROGRESSION_STAGE_COLORS,
  type ProgressionStage,
} from '../../../lib/tournamentProgression'
import { DisciplineChip } from '../../discipline/DisciplineChip'
import { DisciplineMatchRow } from './DisciplineMatchRow'
import { RecapSummaryCard } from './RecapSummaryCard'

type Props = {
  recap: DisciplineRecap
}

function formatRatingDelta(delta: number): string {
  if (delta > 0) return `+${delta}`
  if (delta < 0) return String(delta)
  return '±0'
}

function DisciplineRecapHeader({ recap }: Props) {
  const stageColor =
    recap.bestStage != null
      ? PROGRESSION_STAGE_COLORS[recap.bestStage as ProgressionStage]
      : null

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <DisciplineChip code={recap.discipline} title={recap.disciplineLabel} />
            <span className="text-sm text-ink-700">{recap.disciplineLabel}</span>
          </div>
          {recap.partnerName && (
            <p className="mt-0.5 text-xs text-ink-600">with {recap.partnerName}</p>
          )}
        </div>
        {recap.ratingDelta != null && (
          <div className="shrink-0 text-right">
            <p
              className={`text-lg font-semibold tabular-nums leading-tight ${
                recap.ratingDelta > 0
                  ? 'text-gain-700'
                  : recap.ratingDelta < 0
                    ? 'text-loss-700'
                    : 'text-ink-700'
              }`}
            >
              {formatRatingDelta(recap.ratingDelta)}
              <span className="ml-1 text-xs font-normal text-ink-500">rating</span>
            </p>
            {recap.ratingStart != null && recap.ratingEnd != null && (
              <p className="text-xs tabular-nums text-ink-500">
                {recap.ratingStart} → {recap.ratingEnd}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-700">
        <span>{formatWinLossRecord(recap.matchWins, recap.matchLosses)}</span>
        {recap.bestStageLabel && stageColor && (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: stageColor }}
              aria-hidden
            />
            {recap.bestStageLabel}
          </span>
        )}
      </div>
    </>
  )
}

export function DisciplineRecapBlock({ recap }: Props) {
  const style = getDisciplineStyle(recap.discipline)

  return (
    <article
      className={`rounded-xl card-frame border-l-4 ${style.borderClass} ${style.rowBgClass} px-3 py-3`}
    >
      <DisciplineRecapHeader recap={recap} />

      {recap.eventCallouts.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-ink-100/80 pt-3">
          {recap.eventCallouts.map((callout) => (
            <RecapSummaryCard key={callout.id} card={callout} />
          ))}
        </div>
      )}

      {recap.matches.length > 0 && (
        <ol
          className={`border-t border-ink-200/70 pt-2 ${
            recap.eventCallouts.length > 0 ? 'mt-3' : 'mt-3 border-ink-100/80'
          }`}
        >
          {recap.matches.map((match) => (
            <DisciplineMatchRow key={match.matchKey} match={match} />
          ))}
        </ol>
      )}
    </article>
  )
}
