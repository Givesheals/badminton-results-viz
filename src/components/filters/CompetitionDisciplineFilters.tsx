import type { FilterOptions, MatchFilters } from '../../types/filters'
import { FilterSelect } from './FilterSelect'

type Props = {
  filters: MatchFilters
  options: Pick<FilterOptions, 'competitions' | 'disciplines'>
  onChange: (filters: MatchFilters) => void
  idPrefix?: string
  className?: string
  fields?: { competition?: boolean; discipline?: boolean }
  labelVisibility?: 'sr-only' | 'visible'
}

export function CompetitionDisciplineFilters({
  filters,
  options,
  onChange,
  idPrefix = 'filter',
  className = 'grid gap-3 sm:grid-cols-2',
  fields = { competition: true, discipline: true },
  labelVisibility = 'sr-only',
}: Props) {
  function update<K extends keyof MatchFilters>(key: K, value: MatchFilters[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className={className}>
      {fields.competition !== false && (
        <FilterSelect
          id={`${idPrefix}-competition`}
          label="Competition"
          labelVisibility={labelVisibility}
          value={filters.competition}
          allLabel="All competitions"
          options={options.competitions}
          onChange={(value) => update('competition', value)}
          className="min-w-[9.5rem]"
        />
      )}
      {fields.discipline !== false && (
        <FilterSelect
          id={`${idPrefix}-discipline`}
          label="Discipline"
          labelVisibility={labelVisibility}
          value={filters.discipline}
          allLabel="All disciplines"
          options={options.disciplines}
          onChange={(value) => update('discipline', value)}
          className="min-w-[9.5rem]"
        />
      )}
    </div>
  )
}
