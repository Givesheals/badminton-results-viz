import { useDashboardNavigation } from '../../../context/DashboardNavigationContext'
import {
  buildCategoryMilestoneClaimTarget,
  CATEGORY_MILESTONE_SECTION_ID,
  type CategoryMilestoneClaimTarget,
} from '../../../lib/categoryMilestoneClaims'
import { dashboardSectionHref } from '../../../lib/dashboardSections'
import type { ProgressionStage } from '../../../lib/tournamentProgression'

const LINK_CLASS =
  'mt-2 inline-block text-xs font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 transition hover:text-brand-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200'

type Props = {
  tournamentCategoryLabel: string
  competitionAgeLabel: string | null
  stage: ProgressionStage
  children?: string
  className?: string
}

export function categoryMilestoneClaimTargetFromCelebration(
  tournamentCategoryLabel: string,
  competitionAgeLabel: string | null,
  stage: ProgressionStage,
): CategoryMilestoneClaimTarget | null {
  return buildCategoryMilestoneClaimTarget(
    tournamentCategoryLabel,
    competitionAgeLabel,
    stage,
  )
}

export function CategoryMilestoneClaimLink({
  tournamentCategoryLabel,
  competitionAgeLabel,
  stage,
  children = 'Claim your milestone ↓',
  className = LINK_CLASS,
}: Props) {
  const { navigateToCategoryMilestone } = useDashboardNavigation()
  const target = categoryMilestoneClaimTargetFromCelebration(
    tournamentCategoryLabel,
    competitionAgeLabel,
    stage,
  )

  if (target == null) return null

  return (
    <a
      href={dashboardSectionHref(CATEGORY_MILESTONE_SECTION_ID)}
      className={className}
      onClick={(event) => {
        event.preventDefault()
        navigateToCategoryMilestone(target.comboKey, target.stage)
      }}
    >
      {children}
    </a>
  )
}
