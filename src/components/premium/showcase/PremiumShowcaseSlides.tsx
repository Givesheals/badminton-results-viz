import { useMemo } from 'react'
import { CategoryMilestonesSection } from '../../charts/CategoryMilestonesSection'
import { ResultsOverTimeSection } from '../../charts/ResultsOverTimeSection'
import { OpponentMatchupsSection } from '../../charts/OpponentMatchupsSection'
import { PartnerChemistrySection } from '../../charts/PartnerChemistrySection'
import { PartnerHighlightsSection } from '../../charts/PartnerHighlightsSection'
import { TournamentProgressionSection } from '../../charts/TournamentProgressionSection'
import { SummarySection } from '../../dashboard/SummarySection'
import { TournamentRecapSection } from '../../dashboard/TournamentRecapSection'
import { TabSubgroupHeading } from '../../dashboard/DashboardTabs'
import { computeTournamentRecaps } from '../../../lib/tournamentRecap'
import { pickShowcaseRecapIndex } from '../../../lib/showcaseRecapPick'
import { PremiumScrollViewport, SHOWCASE_SCROLL_HOLD_MS } from './PremiumScrollViewport'
import { usePremiumShowcase } from './PremiumShowcaseContext'
import { ShowcaseRecapNotesBootstrap } from './ShowcaseRecapNotesBootstrap'

/** Scroll duration after the opening hold — slow enough to read content. */
export const SHOWCASE_SCROLL_RECAP_MS = 7000
export const SHOWCASE_SCROLL_SUMMARY_MS = 7000
export const SHOWCASE_SCROLL_PEOPLE_MS = 7000
/** @deprecated Use SHOWCASE_SCROLL_RECAP_MS */
export const SHOWCASE_SCROLL_FAST_MS = SHOWCASE_SCROLL_RECAP_MS

type SlideProps = {
  active: boolean
}

function ShowcaseLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-50/60 to-white">
      <p className="text-sm text-ink-500">Loading preview…</p>
    </div>
  )
}

export function RecapShowcaseSlide({ active }: SlideProps) {
  const data = usePremiumShowcase()
  const initialIndex = useMemo(
    () => (data ? pickShowcaseRecapIndex(computeTournamentRecaps(data.allMatches).recaps) : 0),
    [data],
  )

  if (!data) return <ShowcaseLoading />

  return (
    <PremiumScrollViewport
      active={active}
      durationMs={SHOWCASE_SCROLL_RECAP_MS}
      scrollStartDelayMs={SHOWCASE_SCROLL_HOLD_MS}
      scrollLeaveHiddenPx={520}
    >
      <ShowcaseRecapNotesBootstrap />
      <TournamentRecapSection allMatches={data.allMatches} initialIndex={initialIndex} />
    </PremiumScrollViewport>
  )
}

export function PlayerSummaryShowcaseSlide({ active }: SlideProps) {
  const data = usePremiumShowcase()
  if (!data) return <ShowcaseLoading />

  const sectionProps = {
    allMatches: data.allMatches,
    filterOptions: data.filterOptions,
    importedAt: data.importedAt,
  }

  return (
    <PremiumScrollViewport
      active={active}
      durationMs={SHOWCASE_SCROLL_SUMMARY_MS}
      scrollStartDelayMs={SHOWCASE_SCROLL_HOLD_MS}
      scrollLeaveHiddenPx={480}
    >
      <div className="space-y-4">
        <SummarySection {...sectionProps} />
        <ResultsOverTimeSection key={data.importedAt} {...sectionProps} />
        <CategoryMilestonesSection {...sectionProps} maxMilestoneCards={4} />
        <TournamentProgressionSection {...sectionProps} />
      </div>
    </PremiumScrollViewport>
  )
}

export function PeopleShowcaseSlide({ active }: SlideProps) {
  const data = usePremiumShowcase()
  if (!data) return <ShowcaseLoading />

  const sectionProps = {
    allMatches: data.allMatches,
    filterOptions: data.filterOptions,
    importedAt: data.importedAt,
  }

  return (
    <PremiumScrollViewport
      active={active}
      durationMs={SHOWCASE_SCROLL_PEOPLE_MS}
      scrollStartDelayMs={SHOWCASE_SCROLL_HOLD_MS}
      scrollLeaveHiddenPx={520}
    >
      <div className="space-y-5">
        <div className="space-y-4">
          <TabSubgroupHeading>Who I play with</TabSubgroupHeading>
          <PartnerHighlightsSection {...sectionProps} />
          <PartnerChemistrySection
            {...sectionProps}
            maxPartners={10}
            initialMinThreshold={3}
          />
        </div>
        <div className="space-y-4">
          <TabSubgroupHeading>Who I play against</TabSubgroupHeading>
          <OpponentMatchupsSection {...sectionProps} />
        </div>
      </div>
    </PremiumScrollViewport>
  )
}
