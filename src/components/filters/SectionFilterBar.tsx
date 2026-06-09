import type { FilterField } from '../../types/sectionFilters'
import type { FilterOptions, MatchFilters } from '../../types/filters'
import { CompetitionDisciplineFilters } from './CompetitionDisciplineFilters'
import { FilterSelect } from './FilterSelect'

const FIELD_LABELS: Record<FilterField, string> = {
  time: 'Time',
  competition: 'Competition',
  discipline: 'Discipline',
  partner: 'Partner',
  competitionAge: 'Competition age',
}

type Props = {
  fields: FilterField[]
  filters: MatchFilters
  options: FilterOptions
  onChange: (filters: MatchFilters) => void
  idPrefix: string
  className?: string
}

export function SectionFilterBar({
  fields,
  filters,
  options,
  onChange,
  idPrefix,
  className = 'flex flex-wrap items-end gap-3',
}: Props) {
  const fieldSet = new Set(fields)
  const showCompetitionDiscipline =
    fieldSet.has('competition') || fieldSet.has('discipline')

  function update<K extends keyof MatchFilters>(key: K, value: MatchFilters[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className={className}>
      {showCompetitionDiscipline && (
        <CompetitionDisciplineFilters
          filters={filters}
          options={options}
          onChange={onChange}
          idPrefix={idPrefix}
          className="contents"
          fields={{
            competition: fieldSet.has('competition'),
            discipline: fieldSet.has('discipline'),
          }}
          labelVisibility="visible"
        />
      )}
      {fieldSet.has('partner') && (
        <FilterSelect
          id={`${idPrefix}-partner`}
          label={FIELD_LABELS.partner}
          labelVisibility="visible"
          value={filters.partner}
          allLabel="All partners"
          options={options.partners}
          onChange={(value) => update('partner', value)}
        />
      )}
      {fieldSet.has('time') && (
        <FilterSelect
          id={`${idPrefix}-time`}
          label={FIELD_LABELS.time}
          labelVisibility="visible"
          value={filters.time === 'all' ? '' : filters.time}
          allLabel="All time"
          options={options.timeRanges.filter((o) => o.value !== 'all')}
          onChange={(value) => update('time', value || 'all')}
        />
      )}
      {fieldSet.has('competitionAge') && (
        <FilterSelect
          id={`${idPrefix}-competition-age`}
          label={FIELD_LABELS.competitionAge}
          labelVisibility="visible"
          value={filters.competitionAge}
          allLabel="All ages"
          options={options.competitionAges}
          onChange={(value) => update('competitionAge', value)}
        />
      )}
    </div>
  )
}
