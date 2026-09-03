import { useMemo } from 'react'
import { DashboardNavigationProvider } from '../../context/DashboardNavigationContext'
import { useDataset } from '../../context/DatasetContext'
import { computeStatsFromMatches } from '../../lib/computeStats'
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
import { OpponentNotesSection } from '../notes/OpponentNotesSection'
import { DashboardTabs, TabSubgroupHeading } from './DashboardTabs'
import { PlayerProfileSection } from './PlayerProfileSection'
import { SummarySection } from './SummarySection'
import { SeasonJourneySection } from './SeasonJourneySection'
import { TournamentRecapSection } from './TournamentRecapSection'
import { OpponentNotesProvider } from '../../context/OpponentNotesContext'
import { PremiumHubHeader } from './PremiumHubHeader'

type Props = {
  showcaseMode?: boolean
}

export function Dashboard({ showcaseMode = false }: Props) {
  const { dataset } = useDataset()

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

  const sectionProps = {
    allMatches,
    filterOptions,
    importedAt: dataset.importedAt,
  }

  return (
    <div className="space-y-3">
      {!showcaseMode && (
        <PremiumHubHeader playerName={headerStats.playerName ?? ''} allMatches={allMatches} />
      )}

      <DashboardNavigationProvider>
        <OpponentNotesProvider playerName={headerStats.playerName}>
          <DashboardTabs
            importedAt={dataset.importedAt}
            panels={{
            'latest-event': <TournamentRecapSection allMatches={allMatches} />,
            notes: <OpponentNotesSection allMatches={allMatches} />,
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
        </OpponentNotesProvider>
      </DashboardNavigationProvider>
    </div>
  )
}
