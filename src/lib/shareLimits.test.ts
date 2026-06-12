import { describe, expect, it } from 'vitest'
import type { SeasonAccoladesData } from './seasonTrophyCabinet'
import {
  SHARE_ACCOLADE_LIMIT,
  SHARE_ROW_LIMIT,
  sliceAccoladesForShare,
  sliceRowsForShare,
} from './shareLimits'

function trophy(
  placement: 'first' | 'second' | 'third',
  name: string,
): SeasonAccoladesData['podium']['first'][number] {
  return {
    placement,
    placementLabel: placement,
    tournamentCategoryLabel: 'Gold',
    competitionAgeLabel: null,
    discipline: 'MS',
    disciplineLabel: "Men's singles",
    competitionName: name,
    date: '2025-01-01',
  }
}

function personalBest(name: string): SeasonAccoladesData['personalBests'][number] {
  return {
    tournamentCategoryLabel: 'Gold',
    competitionAgeLabel: null,
    discipline: 'MS',
    disciplineLabel: "Men's singles",
    competitionName: name,
    date: '2025-02-01',
    stage: 'quarter-final',
    stageLabel: 'Quarter-final',
    detail: 'Best finish',
  }
}

describe('sliceAccoladesForShare', () => {
  it('prioritises winners, then runner-up, then third, then personal bests', () => {
    const accolades: SeasonAccoladesData = {
      podium: {
        first: [trophy('first', 'Win A'), trophy('first', 'Win B')],
        second: [trophy('second', 'Second A')],
        third: [trophy('third', 'Third A')],
      },
      personalBests: [personalBest('PB A'), personalBest('PB B')],
      totalPodiumCount: 4,
    }

    const sliced = sliceAccoladesForShare(accolades, SHARE_ACCOLADE_LIMIT)

    expect(sliced.podium.first.map((item) => item.competitionName)).toEqual([
      'Win A',
      'Win B',
    ])
    expect(sliced.podium.second).toHaveLength(1)
    expect(sliced.podium.third).toHaveLength(0)
    expect(sliced.personalBests).toHaveLength(0)
  })

  it('includes personal bests when podium slots remain', () => {
    const accolades: SeasonAccoladesData = {
      podium: {
        first: [trophy('first', 'Win A')],
        second: [],
        third: [],
      },
      personalBests: [personalBest('PB A'), personalBest('PB B')],
      totalPodiumCount: 1,
    }

    const sliced = sliceAccoladesForShare(accolades, 3)

    expect(sliced.podium.first).toHaveLength(1)
    expect(sliced.personalBests.map((item) => item.competitionName)).toEqual([
      'PB A',
      'PB B',
    ])
  })
})

describe('sliceRowsForShare', () => {
  it('limits rows to the share cap', () => {
    const rows = [1, 2, 3, 4, 5, 6, 7]
    expect(sliceRowsForShare(rows, SHARE_ROW_LIMIT)).toEqual([1, 2, 3, 4, 5])
  })
})
