import type { DisciplineRecap } from '../../../lib/tournamentRecap'
import { getDisciplineStyle } from '../../../lib/disciplineStyle'
import { formatWinLossRecord } from '../../../lib/formatNumbers'
import {
  PROGRESSION_STAGE_COLORS,
  type ProgressionStage,
} from '../../../lib/tournamentProgression'
import { DisciplineChip } from '../../discipline/DisciplineChip'

type Props = {
  recap: DisciplineRecap
}

function formatRatingDelta(delta: number): string {
  if (delta > 0) return `+${delta}`
  if (delta < 0) return String(delta)
  return '±0'
}

export function DisciplineRecapRow({ recap }: Props) {
  const style = getDisciplineStyle(recap.discipline)
  const stageColor =
    recap.bestStage != null
      ? PROGRESSION_STAGE_COLORS[recap.bestStage as ProgressionStage]
      : null

  return (
    <div
      className={`rounded-xl card-frame border-l-4 ${style.borderClass} ${style.rowBgClass} px-3 py-3`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <DisciplineChip code={recap.discipline} title={recap.disciplineLabel} />
          <span className="text-sm text-ink-700">{recap.disciplineLabel}</span>
        </div>
        {recap.ratingDelta != null && (
          <span
            className={`text-lg font-semibold tabular-nums ${
              recap.ratingDelta > 0
                ? 'text-gain-700'
                : recap.ratingDelta < 0
                  ? 'text-loss-700'
                  : 'text-ink-700'
            }`}
          >
            {formatRatingDelta(recap.ratingDelta)}
            <span className="ml-1 text-xs font-normal text-ink-500">rating</span>
          </span>
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

      {recap.ratingStart != null && recap.ratingEnd != null && recap.ratingDelta != null && (
        <p className="mt-1 text-xs text-ink-500">
          Rating {recap.ratingStart} → {recap.ratingEnd}
        </p>
      )}
    </div>
  )
}
