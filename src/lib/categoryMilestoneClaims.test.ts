import { describe, expect, it } from 'vitest'
import {
  buildCategoryMilestoneClaimTarget,
  buildFrontierAutoClaims,
  categoryMilestoneCardKey,
  categoryMilestoneRoundKey,
  categoryMilestoneRowId,
  comboKeyFromRow,
  deepestAchievedMilestone,
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

  it('finds the deepest achieved milestone on a card', () => {
    const milestones = [
      milestone('group-stages', true),
      milestone('group-wins', true),
      milestone('quarter-final', true),
      milestone('semi-final', false),
      milestone('runner-up', false),
      milestone('winner', false),
    ]

    expect(deepestAchievedMilestone(milestones)?.stage).toBe('quarter-final')
    expect(deepestAchievedMilestone([milestone('group-stages', false)])).toBeNull()
  })

  it('auto-claims achieved rounds except the frontier per card', () => {
    const partialRow = {
      tournamentCategoryLabel: 'Silver',
      competitionAgeLabel: 'Senior',
      label: 'Senior · Silver',
      tournamentCount: 3,
      milestones: [
        milestone('group-stages', true),
        milestone('group-wins', true),
        milestone('quarter-final', false),
        milestone('semi-final', false),
        milestone('runner-up', false),
        milestone('winner', false),
      ],
    }

    const completeRow = {
      tournamentCategoryLabel: 'Bronze',
      competitionAgeLabel: 'Senior',
      label: 'Senior · Bronze',
      tournamentCount: 5,
      milestones: [
        milestone('group-stages', true),
        milestone('group-wins', true),
        milestone('quarter-final', true),
        milestone('semi-final', true),
        milestone('runner-up', true),
        milestone('winner', true),
      ],
    }

    const claims = buildFrontierAutoClaims([partialRow, completeRow])
    const silverKey = comboKeyFromRow('Silver', 'Senior')
    const bronzeKey = comboKeyFromRow('Bronze', 'Senior')

    expect(claims.has(categoryMilestoneRoundKey(silverKey, 'group-stages'))).toBe(true)
    expect(claims.has(categoryMilestoneRoundKey(silverKey, 'group-wins'))).toBe(false)
    expect(claims.has(categoryMilestoneRoundKey(bronzeKey, 'winner'))).toBe(false)
    expect(claims.has(categoryMilestoneRoundKey(bronzeKey, 'runner-up'))).toBe(true)
    expect(claims.has(categoryMilestoneRoundKey(bronzeKey, 'group-stages'))).toBe(true)
  })
})
