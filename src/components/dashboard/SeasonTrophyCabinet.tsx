import { useMemo } from 'react'
import type {
  SeasonAccoladesData,
  SeasonPersonalBestItem,
  SeasonSeniorCountyDebutItem,
  SeasonTrophyItem,
} from '../../lib/seasonTrophyCabinet'
import { sliceAccoladesForShare } from '../../lib/shareLimits'
import { formatDisplayDate } from '../../lib/formatDate'
import { DisciplineChip } from '../discipline/DisciplineChip'
import { TournamentCategoryChip } from '../tournament/TournamentCategoryChip'

type Props = {
  accolades: SeasonAccoladesData
  maxItems?: number
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

function CompetitionAgeLabel({ label }: { label: string | null }) {
  if (!label) return null

  return (
    <span className="text-xs font-semibold text-ink-800">{label}</span>
  )
}

function CategoryDisciplineChips({
  categoryLabel,
  competitionAgeLabel,
  discipline,
  disciplineLabel,
}: {
  categoryLabel: string
  competitionAgeLabel: string | null
  discipline: string
  disciplineLabel: string
}) {
  return (
    <>
      <CompetitionAgeLabel label={competitionAgeLabel} />
      <TournamentCategoryChip label={categoryLabel} />
      <DisciplineChip code={discipline} title={disciplineLabel} />
    </>
  )
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
        <CategoryDisciplineChips
          categoryLabel={item.tournamentCategoryLabel}
          competitionAgeLabel={item.competitionAgeLabel}
          discipline={item.discipline}
          disciplineLabel={item.disciplineLabel}
        />
      </div>
      <p className="mt-2 text-sm font-medium text-ink-900">{item.competitionName}</p>
      <p className="mt-0.5 text-xs text-ink-500">{formatDisplayDate(item.date)}</p>
      {item.contextNote ? (
        <p className="mt-2 text-xs text-ink-600">{item.contextNote}</p>
      ) : null}
    </article>
  )
}

function PersonalBestCard({ item }: { item: SeasonPersonalBestItem }) {
  return (
    <article className="rounded-lg border border-brand-200/60 bg-white px-3 py-2.5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm leading-none" aria-hidden>
          ✨
        </span>
        <span className="text-xs font-semibold text-brand-800">Personal best</span>
        <CategoryDisciplineChips
          categoryLabel={item.tournamentCategoryLabel}
          competitionAgeLabel={item.competitionAgeLabel}
          discipline={item.discipline}
          disciplineLabel={item.disciplineLabel}
        />
      </div>
      <p className="mt-1.5 text-xs text-ink-600">{item.detail}</p>
      <p className="mt-2 text-sm font-medium text-ink-900">{item.competitionName}</p>
      <p className="mt-0.5 text-xs text-ink-500">{formatDisplayDate(item.date)}</p>
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
            key={`${item.competitionName}|${item.discipline}|${item.competitionAgeLabel ?? ''}|${item.date}|${item.placement}`}
            item={item}
          />
        ))}
      </div>
    </div>
  )
}

function SeniorCountyDebutCard({ item }: { item: SeasonSeniorCountyDebutItem }) {
  return (
    <article className="rounded-lg border border-level-county/40 border-l-4 border-l-level-county bg-gradient-to-br from-level-county/10 via-white to-brand-50/30 px-3 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg leading-none" aria-hidden>
          🎖️
        </span>
        <span className="text-xs font-semibold text-ink-800">{item.title}</span>
        <TournamentCategoryChip label="County" />
      </div>
      <p className="mt-2 text-xs text-ink-600">{item.detail}</p>
      <p className="mt-2 text-sm font-medium text-ink-900">{item.competitionName}</p>
      <p className="mt-0.5 text-xs text-ink-500">{formatDisplayDate(item.date)}</p>
    </article>
  )
}

function PersonalBestShelf({ items }: { items: SeasonPersonalBestItem[] }) {
  if (items.length === 0) return null

  return (
    <div className="space-y-3 border-t border-ink-100 pt-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">
        Personal bests
        <span className="ml-1.5 font-normal normal-case tracking-normal text-ink-500">
          · {items.length}
        </span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <PersonalBestCard
            key={`${item.competitionName}|${item.discipline}|${item.competitionAgeLabel ?? ''}|${item.date}|${item.stage}`}
            item={item}
          />
        ))}
      </div>
    </div>
  )
}

export function SeasonTrophyCabinet({ accolades, maxItems }: Props) {
  const displayAccolades = useMemo(
    () => (maxItems != null ? sliceAccoladesForShare(accolades, maxItems) : accolades),
    [accolades, maxItems],
  )

  const shelves: ShelfConfig[] = [
    { key: 'first', title: 'Winners', items: displayAccolades.podium.first },
    { key: 'second', title: 'Runner-up', items: displayAccolades.podium.second },
    { key: 'third', title: '3rd place', items: displayAccolades.podium.third },
  ]

  const visibleShelves = shelves.filter((shelf) => shelf.items.length > 0)
  const hasPodiums = visibleShelves.length > 0
  const hasPersonalBests = displayAccolades.personalBests.length > 0
  const hasSeniorCountyDebut = displayAccolades.seniorCountyDebut != null
  const hasContent = hasPodiums || hasPersonalBests || hasSeniorCountyDebut

  return (
    <div className="space-y-4">
      {!hasContent ? (
        <p className="text-sm text-ink-600">
          Podium finishes and personal bests will appear here as your season unfolds.
        </p>
      ) : (
        <div className="space-y-6 rounded-xl border border-ink-100 bg-gradient-to-b from-white to-ink-50/40 p-4">
          {hasSeniorCountyDebut && displayAccolades.seniorCountyDebut && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                Senior county
              </p>
              <SeniorCountyDebutCard item={displayAccolades.seniorCountyDebut} />
            </div>
          )}
          {hasPodiums &&
            visibleShelves.map((shelf) => (
              <TrophyShelf key={shelf.key} title={shelf.title} items={shelf.items} />
            ))}
          <PersonalBestShelf items={displayAccolades.personalBests} />
        </div>
      )}
    </div>
  )
}
