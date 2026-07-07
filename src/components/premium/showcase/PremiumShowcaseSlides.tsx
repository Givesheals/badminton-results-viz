import { CategoryMilestonesSection } from '../../charts/CategoryMilestonesSection'
import { ResultsOverTimeSection } from '../../charts/ResultsOverTimeSection'
import { OpponentMatchupsSection } from '../../charts/OpponentMatchupsSection'
import { PartnerChemistrySection } from '../../charts/PartnerChemistrySection'
import { PartnerHighlightsSection } from '../../charts/PartnerHighlightsSection'
import { SummarySection } from '../../dashboard/SummarySection'
import { TournamentRecapSection } from '../../dashboard/TournamentRecapSection'
import { TabSubgroupHeading } from '../../dashboard/DashboardTabs'
import { PremiumScrollViewport } from './PremiumScrollViewport'
import { usePremiumShowcase } from './PremiumShowcaseContext'

export const SHOWCASE_SCROLL_FAST_MS = 2800
export const SHOWCASE_SCROLL_PEOPLE_MS = 6000

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
  if (!data) return <ShowcaseLoading />

  return (
    <PremiumScrollViewport active={active} durationMs={SHOWCASE_SCROLL_FAST_MS} scrollOvershoot={320}>
      <TournamentRecapSection allMatches={data.allMatches} />
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
      durationMs={SHOWCASE_SCROLL_FAST_MS}
      scrollOvershoot={140}
      scrollStartDelayMs={980}
    >
      <div className="space-y-4">
        <SummarySection {...sectionProps} />
        <ResultsOverTimeSection key={data.importedAt} {...sectionProps} />
        <CategoryMilestonesSection {...sectionProps} />
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
    <PremiumScrollViewport active={active} durationMs={SHOWCASE_SCROLL_PEOPLE_MS} scrollOvershoot={20}>
      <div className="space-y-5">
        <div className="space-y-4">
          <TabSubgroupHeading>Who I play with</TabSubgroupHeading>
          <PartnerHighlightsSection {...sectionProps} />
          <PartnerChemistrySection {...sectionProps} />
        </div>
        <div className="space-y-4">
          <TabSubgroupHeading>Who I play against</TabSubgroupHeading>
          <OpponentMatchupsSection {...sectionProps} />
        </div>
      </div>
    </PremiumScrollViewport>
  )
}
