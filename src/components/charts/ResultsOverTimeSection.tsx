import { useMemo, useState } from 'react'
import { useSectionMatches } from '../../hooks/useSectionMatches'
import { useResetFiltersOnImport } from '../../hooks/useResetFiltersOnImport'
import { countActiveSectionFilters } from '../../lib/filterCounts'
import { competitiveMatches } from '../../lib/matchExclusions'
import { computeResultsOverTimeData } from '../../lib/resultsOverTime'
import {
  inferDefaultGranularity,
  type ResultsTimeRange,
  type TimeGranularity,
} from '../../lib/timePeriods'
import type { FilterOptions } from '../../types/filters'
import { DEFAULT_MATCH_FILTERS, type MatchFilters } from '../../types/filters'
import type { NormalizedMatch } from '../../types/matchHistory'
import { CollapsibleFilters } from '../filters/CollapsibleFilters'
import { FilterMatchCount } from '../filters/FilterMatchCount'
import { SectionFilterBar } from '../filters/SectionFilterBar'
import { SectionHeaderWithFilters } from '../filters/SectionHeaderWithFilters'
import { PlayingActivityChart } from './PlayingActivityChart'
import { WinRateOverTimeChart } from './WinRateOverTimeChart'

type Props = {
  allMatches: NormalizedMatch[]
  filterOptions: FilterOptions
  importedAt: string | undefined
}

const RANGE_OPTIONS: { value: ResultsTimeRange; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '5y', label: 'Last 5 years' },
  { value: '2y', label: 'Last 2 years' },
]

const GRANULARITY_OPTIONS: { value: TimeGranularity; label: string }[] = [
  { value: 'year', label: 'By year' },
  { value: 'quarter', label: 'By quarter' },
]

export function ResultsOverTimeSection({ allMatches, filterOptions, importedAt }: Props) {
  const fields = ['discipline', 'competition', 'competitionAge'] as const
  const [filters, setFilters] = useState<MatchFilters>(DEFAULT_MATCH_FILTERS)
  const [range, setRange] = useState<ResultsTimeRange>('all')
  const [granularity, setGranularity] = useState<TimeGranularity>('quarter')
  const [granularityTouched, setGranularityTouched] = useState(false)

  useResetFiltersOnImport(importedAt, setFilters)

  const matches = useSectionMatches(allMatches, filters)

  const defaultGranularity = useMemo(() => {
    const dates = competitiveMatches(allMatches).map((m) => m.date)
    return inferDefaultGranularity(dates)
  }, [allMatches])

  const effectiveGranularity = granularityTouched ? granularity : defaultGranularity
  const sectionFilterCount = countActiveSectionFilters(filters, [...fields])
  const extraFilterCount =
    (range !== 'all' ? 1 : 0) + (effectiveGranularity !== defaultGranularity ? 1 : 0)

  const chartData = useMemo(
    () =>
      computeResultsOverTimeData(matches, {
        granularity: effectiveGranularity,
        range,
      }),
    [matches, effectiveGranularity, range],
  )

  return (
    <article className="rounded-2xl card-frame bg-white p-4 shadow-sm sm:p-5">
      <SectionHeaderWithFilters
        title={<h3 className="font-medium text-ink-900">Results over time</h3>}
        description={
          <FilterMatchCount filteredCount={matches.length} totalCount={allMatches.length} />
        }
        filters={
          <CollapsibleFilters
            storageKey="filters:results-over-time"
            activeCount={sectionFilterCount + extraFilterCount}
            onReset={() => {
              setFilters(DEFAULT_MATCH_FILTERS)
              setRange('all')
              setGranularityTouched(false)
            }}
          >
            <SectionFilterBar
              fields={[...fields]}
              filters={filters}
              options={filterOptions}
              onChange={setFilters}
              idPrefix="over-time"
            />
            <PeriodControl
              id="over-time-range"
              label="Period"
              value={range}
              options={RANGE_OPTIONS}
              onChange={(value) => setRange(value as ResultsTimeRange)}
            />
            <PeriodControl
              id="over-time-granularity"
              label="Group by"
              value={effectiveGranularity}
              options={GRANULARITY_OPTIONS}
              onChange={(value) => {
                setGranularityTouched(true)
                setGranularity(value as TimeGranularity)
              }}
            />
          </CollapsibleFilters>
        }
      />

      <div className="mt-6 space-y-6">
        <div>
          <h4 className="text-sm font-medium text-ink-900">Playing activity</h4>
          <p className="mt-0.5 text-xs text-ink-700">
            Match count per {effectiveGranularity === 'year' ? 'year' : 'quarter'} — taller bars mean
            more court time.
          </p>
          <div className="mt-2">
            <PlayingActivityChart data={chartData.activity} />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-ink-900">Win rate</h4>
          <div className="mt-2">
            <WinRateOverTimeChart data={chartData.winRate} />
          </div>
        </div>
      </div>
    </article>
  )
}

function PeriodControl<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <label className="block min-w-[9.5rem]" htmlFor={id}>
      <span className="mb-1 block text-xs font-medium text-ink-700">{label}</span>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="w-full appearance-none rounded-lg border border-ink-200 bg-white py-2 pr-8 pl-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-brand-500"
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
      </div>
    </label>
  )
}
