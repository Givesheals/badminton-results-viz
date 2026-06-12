import type { SeasonTrophyCabinetData, SeasonTrophyItem } from '../../lib/seasonTrophyCabinet'
import { formatDisplayDate } from '../../lib/formatDate'
import { DisciplineChip } from '../discipline/DisciplineChip'
import { TournamentCategoryChip } from '../tournament/TournamentCategoryChip'

type Props = {
  cabinet: SeasonTrophyCabinetData
}

const PLACEMENT_ICONS: Record<SeasonTrophyItem['placement'], string> = {
  first: '🏆',
  second: '🥈',
  third: '🥉',
}

const PLACEMENT_ACCENT: Record<SeasonTrophyItem['placement'], string> = {
  first: 'border-brand-600',
  second: 'border-brand-400',
  third: 'border-brand-300',
}

type ShelfConfig = {
  key: 'first' | 'second' | 'third'
  title: string
  items: SeasonTrophyItem[]
}

function TrophyCard({ item }: { item: SeasonTrophyItem }) {
  return (
    <article
      className={`rounded-lg border border-ink-100 border-l-4 bg-white px-3 py-3 shadow-sm ${PLACEMENT_ACCENT[item.placement]}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg leading-none" aria-hidden>
          {PLACEMENT_ICONS[item.placement]}
        </span>
        <span className="text-xs font-semibold text-ink-700">{item.placementLabel}</span>
        <TournamentCategoryChip label={item.tournamentCategoryLabel} />
        <DisciplineChip code={item.discipline} title={item.disciplineLabel} />
      </div>
      <p className="mt-2 text-sm font-medium text-ink-900">{item.competitionName}</p>
      <p className="mt-0.5 text-xs text-ink-500">{formatDisplayDate(item.date)}</p>
      {item.contextNote ? (
        <p className="mt-2 text-xs text-ink-600">{item.contextNote}</p>
      ) : null}
    </article>
  )
}

function TrophyShelf({ title, items }: { title: string; items: SeasonTrophyItem[] }) {
  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">
        {title}
        <span className="ml-1.5 font-normal normal-case tracking-normal text-ink-500">
          · {items.length}
        </span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <TrophyCard
            key={`${item.competitionName}|${item.discipline}|${item.date}|${item.placement}`}
            item={item}
          />
        ))}
      </div>
    </div>
  )
}

export function SeasonTrophyCabinet({ cabinet }: Props) {
  const shelves: ShelfConfig[] = [
    { key: 'first', title: 'Winners', items: cabinet.first },
    { key: 'second', title: 'Runner-up', items: cabinet.second },
    { key: 'third', title: '3rd place', items: cabinet.third },
  ]

  const visibleShelves = shelves.filter((shelf) => shelf.items.length > 0)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-ink-800">Trophy cabinet</p>
        <p className="mt-0.5 text-xs text-ink-500">Podium finishes this season</p>
      </div>

      {visibleShelves.length === 0 ? (
        <p className="text-sm text-ink-600">
          Podium finishes will appear here as you reach finals this season.
        </p>
      ) : (
        <div className="space-y-6 rounded-xl border border-ink-100 bg-gradient-to-b from-white to-ink-50/40 p-4">
          {visibleShelves.map((shelf) => (
            <TrophyShelf key={shelf.key} title={shelf.title} items={shelf.items} />
          ))}
        </div>
      )}
    </div>
  )
}
