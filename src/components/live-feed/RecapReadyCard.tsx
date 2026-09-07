import { useId, useState } from 'react'
import { TournamentCategoryChip } from '../tournament/TournamentCategoryChip'

export type RecapReadyCardData = {
  competitionName: string
  dateLabel: string
  categoryLabel: string
}

type Props = {
  card: RecapReadyCardData
}

function RecapReadyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.8 13.55 9.2 20 10.75 13.55 12.3 12 18.7 10.45 12.3 4 10.75 10.45 9.2 12 2.8Z" />
      <path d="M18.4 14.2 19.1 16.9 21.8 17.6 19.1 18.3 18.4 21 17.7 18.3 15 17.6 17.7 16.9 18.4 14.2Z" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.24a.75.75 0 010 1.08l-4.5 4.24a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function AccordionToggleChevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      className={`${className ?? 'h-5 w-5'} shrink-0 transition ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function RecapReadyCard({ card }: Props) {
  const [expanded, setExpanded] = useState(true)
  const panelId = useId()

  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-brand-600 bg-white">
      <button
        type="button"
        className="flex w-full items-center gap-2 bg-brand-600 px-3 py-2.5 text-left text-white outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-200"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((value) => !value)}
      >
        <RecapReadyIcon className="h-5 w-5 shrink-0 text-shuttle-400" />
        <span className="text-base font-bold">Your recap</span>
        <AccordionToggleChevron open={expanded} className="ml-auto h-5 w-5 text-white" />
      </button>

      {expanded ? (
        <div id={panelId}>
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="line-clamp-2 text-base font-semibold leading-snug text-brand-700 underline decoration-brand-600 underline-offset-2">
                {card.competitionName}
              </p>
              <p className="mt-1 text-sm text-ink-600">{card.dateLabel}</p>
            </div>
            <TournamentCategoryChip label={card.categoryLabel} className="mt-0.5" />
          </div>

          <div className="border-t border-ink-100" />

          <button
            type="button"
            className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left outline-none transition hover:bg-brand-50/60 focus-visible:bg-brand-50/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-300"
            aria-label={`Open your recap for ${card.competitionName}`}
          >
            <div className="min-w-0">
              <p className="text-base font-bold text-brand-700">See what stood out for you</p>
              <p className="mt-1 text-sm text-ink-600">Highlights and curiosities from your weekend</p>
            </div>
            <ChevronRightIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
