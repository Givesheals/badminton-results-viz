import type { RecapInsight } from '../../../lib/tournamentRecap'
import { DisciplineChip } from '../../discipline/DisciplineChip'

type Props = {
  insight: RecapInsight
  variant?: 'personal' | 'event'
  className?: string
}

export function RecapFactCard({
  insight,
  variant = 'personal',
  className = '',
}: Props) {
  const isEvent = variant === 'event'

  return (
    <div
      className={`rounded-xl px-3 py-2.5 shadow-sm ${
        isEvent
          ? 'border border-brand-200/80 bg-gradient-to-br from-brand-50/85 to-white'
          : 'card-frame bg-white/90'
      } ${className}`}
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
          <p
            className={`text-sm ${
              isEvent ? 'font-semibold text-brand-800' : 'font-medium text-ink-900'
            }`}
          >
            {insight.title}
          </p>
          {insight.detail && (
            <p className="mt-0.5 text-xs text-ink-600">{insight.detail}</p>
          )}
        </div>
      </div>
    </div>
  )
}
