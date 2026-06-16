import { describe, expect, it } from 'vitest'
import {
  buildCategoryMilestoneClaimTarget,
  categoryMilestoneCardKey,
  categoryMilestoneRoundKey,
  categoryMilestoneRowId,
  comboKeyFromRow,
  resolveCardDisplayState,
  resolveRoundDisplayState,
} from './categoryMilestoneClaims'
import type { CategoryCompletionMilestone } from './tournamentProgression'

function milestone(stage: CategoryCompletionMilestone['stage'], achieved: boolean) {
  return {
    stage,
    label: stage,
    achieved,
    firstAchievement: null,
  } satisfies CategoryCompletionMilestone
}

describe('categoryMilestoneClaims', () => {
  const comboKey = comboKeyFromRow('Silver', 'Senior')

  it('builds stable round and card keys', () => {
    expect(categoryMilestoneRoundKey(comboKey, 'group-wins')).toBe(
      `${comboKey}:group-wins`,
    )
    expect(categoryMilestoneCardKey(comboKey)).toBe(`${comboKey}:card`)
  })

  it('builds a safe row id from combo key', () => {
    expect(categoryMilestoneRowId(comboKey)).toMatch(/^category-milestone-row-/)
  })

  it('resolves round display states', () => {
    expect(resolveRoundDisplayState(false, false)).toBe('locked')
    expect(resolveRoundDisplayState(true, false)).toBe('claimable')
    expect(resolveRoundDisplayState(true, true)).toBe('claimed')
  })

  it('resolves card display states', () => {
    const milestones = [
      milestone('group-stages', true),
      milestone('group-wins', true),
      milestone('quarter-final', false),
      milestone('semi-final', false),
      milestone('runner-up', false),
      milestone('winner', false),
    ]

    expect(resolveCardDisplayState(milestones, comboKey, new Set())).toBe('active')

    const claimedRounds = new Set([
      categoryMilestoneRoundKey(comboKey, 'group-stages'),
      categoryMilestoneRoundKey(comboKey, 'group-wins'),
    ])
    expect(resolveCardDisplayState(milestones, comboKey, claimedRounds)).toBe('active')

    const allAchieved = milestones.map((item, index) =>
      index < 2 ? item : { ...item, achieved: true },
    )
    expect(resolveCardDisplayState(allAchieved, comboKey, claimedRounds)).toBe('active')

    const allClaimed = new Set(
      allAchieved.map((item) => categoryMilestoneRoundKey(comboKey, item.stage)),
    )
    expect(resolveCardDisplayState(allAchieved, comboKey, allClaimed)).toBe('ready_to_claim')

    allClaimed.add(categoryMilestoneCardKey(comboKey))
    expect(resolveCardDisplayState(allAchieved, comboKey, allClaimed)).toBe('complete')
  })

  it('builds claim targets only for category completion stages', () => {
    expect(
      buildCategoryMilestoneClaimTarget('Silver', 'Senior', 'quarter-final'),
    ).toEqual({
      comboKey,
      stage: 'quarter-final',
    })
    expect(buildCategoryMilestoneClaimTarget('Silver', 'Senior', 'knockout')).toBeNull()
  })
})
