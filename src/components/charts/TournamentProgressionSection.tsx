import { useEffect, useMemo, useState } from 'react'
import { useSectionMatches } from '../../hooks/useSectionMatches'
import { useShareCapture } from '../../hooks/useShareCapture'
import { countActiveSectionFilters } from '../../lib/filterCounts'
import { competitiveMatches } from '../../lib/matchExclusions'
import {
  computeTournamentProgression,
  matchFiltersForPrimaryCombo,
} from '../../lib/tournamentProgression'
import type { FilterOptions } from '../../types/filters'
import { DEFAULT_MATCH_FILTERS, type MatchFilters } from '../../types/filters'
import type { NormalizedMatch } from '../../types/matchHistory'
import { CollapsibleFilters } from '../filters/CollapsibleFilters'
import { FilterMatchCount } from '../filters/FilterMatchCount'
import { SectionFilterBar } from '../filters/SectionFilterBar'
import { SectionHeaderWithFilters } from '../filters/SectionHeaderWithFilters'
import { TournamentProgressionAverage } from './TournamentProgressionAverage'
import { TournamentProgressionScope } from './TournamentProgressionScope'
import { tournamentProgressionInfo } from '../../content/sectionInfo'
import { SectionHeading } from '../ui/SectionHeading'
import { ShareButton } from '../ui/ShareButton'
import { TournamentProgressionChart } from './TournamentProgressionChart'

type Props = {
  allMatches: NormalizedMatch[]
  filterOptions: FilterOptions
  importedAt: string | undefined
}

export function TournamentProgressionSection({
  allMatches,
  filterOptions,
  importedAt,
}: Props) {
  const fields = ['time', 'competition', 'discipline', 'competitionAge'] as const

  const sectionDefaultFilters = useMemo(
    () =>
      matchFiltersForPrimaryCombo(
        computeTournamentProgression(competitiveMatches(allMatches)).primaryCombo,
      ),
    [allMatches],
  )

  const progressionFilterOptions = useMemo(
    () => ({
      ...filterOptions,
      competitions: filterOptions.competitions.filter(
        (option) => option.label.trim().toLowerCase() !== 'county',
      ),
    }),
    [filterOptions],
  )

  const [filters, setFilters] = useState<MatchFilters>(() => sectionDefaultFilters)

  useEffect(() => {
    setFilters(sectionDefaultFilters)
  }, [importedAt, sectionDefaultFilters])

  const matches = useSectionMatches(allMatches, filters)
  const progression = useMemo(
    () => computeTournamentProgression(competitiveMatches(matches)),
    [matches],
  )

  const {
    shareRef,
    share: shareSection,
    status: shareStatus,
  } = useShareCapture({
    filename: 'badminton-tournament-progression.png',
    title: 'Tournament progression',
  })

  return (
    <article className="rounded-2xl card-frame bg-white p-4 shadow-sm sm:p-5">
      <SectionHeaderWithFilters
        title={
          <SectionHeading
            info={tournamentProgressionInfo}
            infoLabel="About Tournament progression"
          >
            <h3 className="font-medium text-ink-900">Tournament progression</h3>
          </SectionHeading>
        }
        description={
          <FilterMatchCount filteredCount={matches.length} totalCount={allMatches.length} />
        }
        titleActions={
          <ShareButton
            onClick={() => void shareSection()}
            status={shareStatus}
            disabled={progression.tournamentCount === 0}
          />
        }
        filters={
          <CollapsibleFilters
            storageKey="filters:tournament-progression"
            activeCount={countActiveSectionFilters(filters, [...fields])}
            onReset={() => setFilters(DEFAULT_MATCH_FILTERS)}
          >
            <SectionFilterBar
              fields={[...fields]}
              filters={filters}
              options={progressionFilterOptions}
              onChange={setFilters}
              idPrefix="progression"
            />
          </CollapsibleFilters>
        }
      />

      <div ref={shareRef} data-share-root>
        <div className="border-b border-ink-100 py-3">
          <TournamentProgressionScope
            filters={filters}
            filterOptions={progressionFilterOptions}
            tournamentCount={progression.tournamentCount}
          />
        </div>
        <div className="py-3">
          <TournamentProgressionAverage
            typicalLabel={progression.typicalLabel}
            typicalRank={progression.typicalRank}
            depthBarSegments={progression.depthBarSegments}
            knockoutOrBetterPercent={progression.knockoutOrBetterPercent}
            tournamentCount={progression.tournamentCount}
          />
        </div>
        <div className="border-t border-ink-100 pt-4">
          <h4 className="text-sm font-medium text-ink-900">Finish distribution</h4>
          <div className="mt-2">
            <TournamentProgressionChart
              data={progression.distribution}
              tournamentCount={progression.tournamentCount}
            />
          </div>
        </div>
      </div>
    </article>
  )
}
