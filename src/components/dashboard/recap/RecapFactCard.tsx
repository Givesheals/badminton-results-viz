import type { RecapInsight } from '../../../lib/tournamentRecap'
import { DisciplineChip } from '../../discipline/DisciplineChip'

type Props = {
  insight: RecapInsight
  className?: string
}

export function RecapFactCard({ insight, className = '' }: Props) {
  return (
    <div
      className={`rounded-xl card-frame bg-white/90 px-3 py-2.5 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex w-10 shrink-0 justify-center pt-0.5">
          {insight.discipline ? (
            <DisciplineChip code={insight.discipline} />
          ) : insight.icon ? (
            <span className="text-2xl leading-none" aria-hidden>
              {insight.icon}
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink-900">{insight.title}</p>
          {insight.detail && (
            <p className="mt-0.5 text-xs text-ink-600">{insight.detail}</p>
          )}
        </div>
      </div>
    </div>
  )
}
