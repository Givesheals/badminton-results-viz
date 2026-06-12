import type { RecapSummaryCard as RecapSummaryCardData } from '../../../lib/tournamentRecap'

type Props = {
  card: RecapSummaryCardData
}

export function RecapSummaryCard({ card }: Props) {
  return (
    <div className="rounded-lg bg-white px-2.5 py-2 shadow-sm ring-1 ring-ink-100/80">
      <div className="flex items-start gap-2">
        <span className="text-lg leading-none" aria-hidden>
          {card.icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-900">{card.label}</p>
          {card.detail && (
            <p className="mt-0.5 text-xs leading-snug text-ink-600">{card.detail}</p>
          )}
        </div>
      </div>
    </div>
  )
}
