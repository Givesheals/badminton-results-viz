import { useMemo, useState } from 'react'
import { useSectionMatches } from '../../hooks/useSectionMatches'
import { useResetFiltersOnImport } from '../../hooks/useResetFiltersOnImport'
import { computeStatsFromMatches } from '../../lib/computeStats'
import { countActiveSectionFilters } from '../../lib/filterCounts'
import type { FilterOptions } from '../../types/filters'
import { DEFAULT_MATCH_FILTERS, type MatchFilters } from '../../types/filters'
import type { NormalizedMatch } from '../../types/matchHistory'
import { CollapsibleFilters } from '../filters/CollapsibleFilters'
import { FilterMatchCount } from '../filters/FilterMatchCount'
import { SectionFilterBar } from '../filters/SectionFilterBar'
import { SectionHeaderWithFilters } from '../filters/SectionHeaderWithFilters'
import { SummaryStats } from './SummaryStats'

type Props = {
  allMatches: NormalizedMatch[]
  filterOptions: FilterOptions
  importedAt: string | undefined
}

export function SummarySection({ allMatches, filterOptions, importedAt }: Props) {
  const fields = ['time', 'competition', 'competitionAge'] as const
  const [filters, setFilters] = useState<MatchFilters>(DEFAULT_MATCH_FILTERS)
  useResetFiltersOnImport(importedAt, setFilters)

  const matches = useSectionMatches(allMatches, filters)
  const stats = useMemo(() => computeStatsFromMatches(matches), [matches])

  return (
    <section className="overflow-hidden rounded-2xl card-frame bg-ink-50/80 shadow-sm">
      <SectionHeaderWithFilters
        className="bg-white px-4 py-3 sm:px-5"
        bordered
        title={<h3 className="font-medium text-ink-900">All-time summary</h3>}
        description={
          <FilterMatchCount
            filteredCount={matches.length}
            totalCount={allMatches.length}
          />
        }
        filters={
          <CollapsibleFilters
            storageKey="filters:summary"
            activeCount={countActiveSectionFilters(filters, [...fields])}
            onReset={() => setFilters(DEFAULT_MATCH_FILTERS)}
          >
            <SectionFilterBar
              fields={[...fields]}
              filters={filters}
              options={filterOptions}
              onChange={setFilters}
              idPrefix="summary"
            />
          </CollapsibleFilters>
        }
      />
      <SummaryStats stats={stats} />
    </section>
  )
}
