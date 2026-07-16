import {
  CATEGORY_COMPLETION_STAGES,
  categoryAgeComboKey,
  categoryCompletionAgeKey,
  groupCategoryCompletionsByAge,
  pickDefaultVisibleAgeLabels,
  type CategoryCompletionMilestone,
  type CategoryCompletionRow,
  type ProgressionStage,
} from './tournamentProgression'

export const CATEGORY_MILESTONE_SECTION_ID = 'category-milestones'

export type RoundDisplayState = 'locked' | 'claimable' | 'claimed'

export type CardDisplayState = 'active' | 'ready_to_claim' | 'complete'

export type CategoryMilestoneClaimTarget = {
  comboKey: string
  stage: ProgressionStage
}

export function categoryMilestoneRoundKey(
  comboKey: string,
  stage: ProgressionStage,
): string {
  return `${comboKey}:${stage}`
}

export function categoryMilestoneCardKey(comboKey: string): string {
  return `${comboKey}:card`
}

export function categoryMilestoneRowId(comboKey: string): string {
  const encoded = encodeURIComponent(comboKey).replace(/%/g, '_')
  return `category-milestone-row-${encoded}`
}

export function comboKeyFromRow(
  tournamentCategoryLabel: string,
  competitionAgeLabel: string | null,
): string {
  return categoryAgeComboKey({ tournamentCategoryLabel, competitionAgeLabel })
}

export function resolveRoundDisplayState(
  achieved: boolean,
  isClaimed: boolean,
): RoundDisplayState {
  if (!achieved) return 'locked'
  if (!isClaimed) return 'claimable'
  return 'claimed'
}

export function resolveCardDisplayState(
  milestones: CategoryCompletionMilestone[],
  comboKey: string,
  claimedKeys: ReadonlySet<string>,
): CardDisplayState {
  if (claimedKeys.has(categoryMilestoneCardKey(comboKey))) return 'complete'

  const allAchieved = milestones.every((milestone) => milestone.achieved)
  if (!allAchieved) return 'active'

  const allRoundsClaimed = milestones.every((milestone) =>
    claimedKeys.has(categoryMilestoneRoundKey(comboKey, milestone.stage)),
  )
  if (allRoundsClaimed) return 'ready_to_claim'

  return 'active'
}

/** Deepest achieved stage on a card (milestones are ordered shallow → deep). */
export function deepestAchievedMilestone(
  milestones: CategoryCompletionMilestone[],
): CategoryCompletionMilestone | null {
  let deepest: CategoryCompletionMilestone | null = null
  for (const milestone of milestones) {
    if (milestone.achieved) deepest = milestone
  }
  return deepest
}

/**
 * Pre-claim every achieved round except the frontier (deepest) per card so first
 * visit is not a wall of claimable badges.
 */
export function buildFrontierAutoClaims(rows: CategoryCompletionRow[]): Set<string> {
  const claims = new Set<string>()

  for (const row of rows) {
    const comboKey = comboKeyFromRow(row.tournamentCategoryLabel, row.competitionAgeLabel)
    const frontier = deepestAchievedMilestone(row.milestones)
    if (frontier == null) continue

    for (const milestone of row.milestones) {
      if (!milestone.achieved || milestone.stage === frontier.stage) continue
      claims.add(categoryMilestoneRoundKey(comboKey, milestone.stage))
    }
  }

  return claims
}

/**
 * Pre-claim every achieved round (and completed cards) for age groups below the
 * player's current top band so earlier junior/masters history does not need manual claiming.
 */
export function buildEarlierAgeGroupAutoClaims(rows: CategoryCompletionRow[]): Set<string> {
  const claims = new Set<string>()
  const ageGroups = groupCategoryCompletionsByAge(rows)
  const topAgeKey = pickDefaultVisibleAgeLabels(ageGroups, 1)[0]
  if (topAgeKey == null) return claims

  for (const row of rows) {
    if (categoryCompletionAgeKey(row.competitionAgeLabel) === topAgeKey) continue

    const comboKey = comboKeyFromRow(row.tournamentCategoryLabel, row.competitionAgeLabel)

    for (const milestone of row.milestones) {
      if (!milestone.achieved) continue
      claims.add(categoryMilestoneRoundKey(comboKey, milestone.stage))
    }

    if (row.milestones.every((milestone) => milestone.achieved)) {
      claims.add(categoryMilestoneCardKey(comboKey))
    }
  }

  return claims
}

export function buildCategoryMilestoneAutoClaims(rows: CategoryCompletionRow[]): Set<string> {
  const claims = buildFrontierAutoClaims(rows)
  for (const key of buildEarlierAgeGroupAutoClaims(rows)) {
    claims.add(key)
  }
  return claims
}

export function buildCategoryMilestoneClaimTarget(
  tournamentCategoryLabel: string,
  competitionAgeLabel: string | null,
  stage: ProgressionStage,
): CategoryMilestoneClaimTarget | null {
  if (!(CATEGORY_COMPLETION_STAGES as readonly ProgressionStage[]).includes(stage)) {
    return null
  }

  return {
    comboKey: categoryAgeComboKey({ tournamentCategoryLabel, competitionAgeLabel }),
    stage,
  }
}
