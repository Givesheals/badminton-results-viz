import type { FilterOptions, MatchFilters } from '../../types/filters'
import { TournamentCategoryChip } from '../tournament/TournamentCategoryChip'

type Props = {
  filters: MatchFilters
  filterOptions: FilterOptions
  tournamentCount: number
}

export function TournamentProgressionScope({
  filters,
  filterOptions,
  tournamentCount,
}: Props) {
  const ageLabel = filters.competitionAge.trim()
  const competitionValue = filters.competition.trim()
  const competitionLabel = competitionValue
    ? (filterOptions.competitions.find((option) => option.value === competitionValue)?.label ??
      competitionValue)
    : null

  const eventLabel = tournamentCount === 1 ? 'event' : 'events'

  return (
    <div
      className="flex flex-wrap items-center gap-x-2 gap-y-1"
      aria-label={`Showing ${ageLabel || 'all ages'}, ${competitionLabel || 'all levels'}, ${tournamentCount} ${eventLabel}`}
    >
      <span className="text-xs font-medium text-ink-500">Showing</span>
      {ageLabel ? (
        <span className="text-sm font-semibold text-ink-900">{ageLabel}</span>
      ) : (
        <span className="text-sm text-ink-500">All ages</span>
      )}
      {competitionLabel ? (
        <TournamentCategoryChip label={competitionLabel} />
      ) : (
        <span className="text-sm text-ink-500">All levels</span>
      )}
      <span className="text-xs text-ink-500">
        {tournamentCount} {eventLabel}
      </span>
    </div>
  )
}
