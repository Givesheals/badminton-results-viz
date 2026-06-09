import { useMemo, useState } from 'react'
import { useSectionMatches } from '../../hooks/useSectionMatches'
import { useResetFiltersOnImport } from '../../hooks/useResetFiltersOnImport'
import { countActiveSectionFilters } from '../../lib/filterCounts'
import { isCompetitiveMatch } from '../../lib/matchExclusions'
import type { FilterOptions } from '../../types/filters'
import { DEFAULT_MATCH_FILTERS, type MatchFilters } from '../../types/filters'
import type { NormalizedMatch } from '../../types/matchHistory'
import { CollapsibleFilters } from '../filters/CollapsibleFilters'
import { FilterMatchCount } from '../filters/FilterMatchCount'
import { SectionFilterBar } from '../filters/SectionFilterBar'
import { SectionHeaderWithFilters } from '../filters/SectionHeaderWithFilters'
import { CategoryChart } from './CategoryChart'

type Props = {
  allMatches: NormalizedMatch[]
  filterOptions: FilterOptions
  importedAt: string | undefined
}

export function MatchesByDisciplineSection({
  allMatches,
  filterOptions,
  importedAt,
}: Props) {
  const fields = ['time', 'competition', 'competitionAge'] as const
  const [filters, setFilters] = useState<MatchFilters>(DEFAULT_MATCH_FILTERS)
  useResetFiltersOnImport(importedAt, setFilters)

  const matches = useSectionMatches(allMatches, filters)

  const byDiscipline = useMemo(() => {
    const disciplineCounts = new Map<string, number>()

    for (const match of matches) {
      if (!isCompetitiveMatch(match)) continue
      disciplineCounts.set(
        match.disciplineLabel,
        (disciplineCounts.get(match.disciplineLabel) ?? 0) + 1,
      )
    }

    return [...disciplineCounts.entries()]
      .map(([name, count]) => ({ name, matches: count }))
      .sort((a, b) => b.matches - a.matches)
  }, [matches])

  return (
    <article className="rounded-2xl card-frame bg-white p-4 shadow-sm sm:p-5">
      <SectionHeaderWithFilters
        title={<h3 className="font-medium text-ink-900">Matches by discipline</h3>}
        description={
          <FilterMatchCount filteredCount={matches.length} totalCount={allMatches.length} />
        }
        filters={
          <CollapsibleFilters
            storageKey="filters:discipline-chart"
            activeCount={countActiveSectionFilters(filters, [...fields])}
            onReset={() => setFilters(DEFAULT_MATCH_FILTERS)}
          >
            <SectionFilterBar
              fields={[...fields]}
              filters={filters}
              options={filterOptions}
              onChange={setFilters}
              idPrefix="discipline-chart"
            />
          </CollapsibleFilters>
        }
      />
      <div className="mt-4">
        <CategoryChart data={byDiscipline} />
      </div>
    </article>
  )
}
