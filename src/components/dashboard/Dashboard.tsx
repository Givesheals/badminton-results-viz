import { useMemo } from 'react'
import { DashboardNavigationProvider } from '../../context/DashboardNavigationContext'
import { useDataset } from '../../context/DatasetContext'
import { computeStatsFromMatches } from '../../lib/computeStats'
import { formatDisplayDate } from '../../lib/formatDate'
import { buildFilterOptions } from '../../lib/filterMatches'
import { normalizeDataset } from '../../lib/matchHistory'
import { BestWinsSection } from '../charts/BestWinsSection'
import { MatchesByDisciplineSection } from '../charts/MatchesByDisciplineSection'
import { PartnerHighlightsSection } from '../charts/PartnerHighlightsSection'
import { PartnerChemistrySection } from '../charts/PartnerChemistrySection'
import { ResultsOverTimeSection } from '../charts/ResultsOverTimeSection'
import { CategoryMilestonesSection } from '../charts/CategoryMilestonesSection'
import { TournamentProgressionSection } from '../charts/TournamentProgressionSection'
import { OpponentMatchupsSection } from '../charts/OpponentMatchupsSection'
import { DashboardTabs, TabSubgroupHeading } from './DashboardTabs'
import { PlayerProfileSection } from './PlayerProfileSection'
import { SummarySection } from './SummarySection'
import { SeasonJourneySection } from './SeasonJourneySection'
import { TournamentRecapSection } from './TournamentRecapSection'

export function Dashboard() {
  const { dataset, clearDataset } = useDataset()

  const allMatches = useMemo(
    () => (dataset ? normalizeDataset(dataset) : []),
    [dataset],
  )

  const filterOptions = useMemo(() => buildFilterOptions(allMatches), [allMatches])

  const headerStats = useMemo(
    () => computeStatsFromMatches(allMatches),
    [allMatches],
  )

  if (!dataset) return null

  const title = headerStats.playerName
    ? `${headerStats.playerName}'s results`
    : 'Your results'
  const dateRange =
    headerStats.dateFrom && headerStats.dateTo
      ? `${formatDisplayDate(headerStats.dateFrom)} → ${formatDisplayDate(headerStats.dateTo)}`
      : null

  const sectionProps = {
    allMatches,
    filterOptions,
    importedAt: dataset.importedAt,
  }

  return (
    <div className="space-y-6">
      <section
        id="dashboard-results-header"
        className="scroll-mt-4 flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <h2 className="text-xl font-semibold text-ink-900">{title}</h2>
          {dateRange && (
            <p className="text-sm text-ink-700">{dateRange}</p>
          )}
        </div>
        <button
          type="button"
          onClick={clearDataset}
          className="rounded-lg border border-ink-100 bg-white px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
        >
          Clear & upload another
        </button>
      </section>

      <DashboardNavigationProvider>
        <DashboardTabs
          importedAt={dataset.importedAt}
          panels={{
          'latest-event': <TournamentRecapSection allMatches={allMatches} />,
          'this-season': <SeasonJourneySection allMatches={allMatches} />,
          'all-time': (
            <>
              <SummarySection
                allMatches={allMatches}
                filterOptions={filterOptions}
                importedAt={dataset.importedAt}
              />
              <ResultsOverTimeSection
                key={dataset.importedAt}
                allMatches={allMatches}
                filterOptions={filterOptions}
                importedAt={dataset.importedAt}
              />
              <MatchesByDisciplineSection {...sectionProps} />
              <CategoryMilestonesSection {...sectionProps} />
              <TournamentProgressionSection {...sectionProps} />
              <PlayerProfileSection allMatches={allMatches} />
            </>
          ),
          people: (
            <>
              <div className="space-y-6">
                <TabSubgroupHeading>Who I play with</TabSubgroupHeading>
                <PartnerHighlightsSection {...sectionProps} />
                <PartnerChemistrySection {...sectionProps} />
              </div>
              <div className="space-y-6">
                <TabSubgroupHeading>Who I play against</TabSubgroupHeading>
                <OpponentMatchupsSection {...sectionProps} />
                <BestWinsSection allMatches={allMatches} />
              </div>
            </>
          ),
          }}
        />
      </DashboardNavigationProvider>
    </div>
  )
}
