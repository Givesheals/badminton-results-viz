import { describe, expect, it } from 'vitest'
import {
  isSemiFinalRound,
  KNOCKOUT_OR_BETTER_MIN_RANK,
  lostInSemiFinal,
  medianRank,
  mergeKnockoutCountsForProgressionUI,
  parseRoundToStage,
  percentAtOrBeyondRank,
  progressionBarDisplayWidths,
  progressionDepthBarStageWeight,
  PROGRESSION_UI_STAGE_ORDER,
  progressionBarMarkerPercentFromTypicalRank,
  progressionBarMarkerRankForUI,
  progressionBarMobileLabel,
  progressionDepthBarSegments,
  progressionDistributionBar,
  progressionStageMarkerT,
  STAGE_RANK,
  type ProgressionDistributionRow,
} from './tournamentProgression'

describe('parseRoundToStage', () => {
  it('maps early bracket rounds to knockout', () => {
    expect(parseRoundToStage('R32')).toBe('knockout')
    expect(parseRoundToStage('Round of 16')).toBe('knockout')
    expect(parseRoundToStage('KO')).toBe('knockout')
  })

  it('maps group-style round labels to group-stages', () => {
    expect(parseRoundToStage('Group A')).toBe('group-stages')
    expect(parseRoundToStage('Groups')).toBe('group-stages')
    expect(parseRoundToStage('Group stage')).toBe('group-stages')
  })
})

describe('isSemiFinalRound', () => {
  it('matches semi-final round labels', () => {
    expect(isSemiFinalRound('Semi-final')).toBe(true)
    expect(isSemiFinalRound('SF')).toBe(true)
    expect(isSemiFinalRound('Last 4')).toBe(true)
  })

  it('does not match bronze or silver placement finals', () => {
    expect(isSemiFinalRound('Bronze Final')).toBe(false)
    expect(isSemiFinalRound('Silver Final')).toBe(false)
  })
})

describe('lostInSemiFinal', () => {
  it('returns true when a competitive semi-final match was lost', () => {
    const match = {
      outcome: 'loss',
      nonCompetitiveReason: null,
      raw: { Round: 'Semi-final' },
    } as unknown as Parameters<typeof lostInSemiFinal>[0][number]

    expect(lostInSemiFinal([match])).toBe(true)
  })

  it('returns false for bronze final loss', () => {
    const match = {
      outcome: 'loss',
      nonCompetitiveReason: null,
      raw: { Round: 'Bronze Final' },
    } as unknown as Parameters<typeof lostInSemiFinal>[0][number]

    expect(lostInSemiFinal([match])).toBe(false)
  })
})

describe('mergeKnockoutCountsForProgressionUI', () => {
  it('adds knockout counts to quarter-final for the progression UI only', () => {
    const counts = new Map([
      ['knockout', 2],
      ['quarter-final', 1],
      ['group-wins', 3],
    ] as const)
    const merged = mergeKnockoutCountsForProgressionUI(counts)
    expect(merged.get('quarter-final')).toBe(3)
    expect(merged.has('knockout')).toBe(false)
  })
})

describe('percentAtOrBeyondRank', () => {
  it('returns 0 for an empty list', () => {
    expect(percentAtOrBeyondRank([], KNOCKOUT_OR_BETTER_MIN_RANK)).toBe(0)
  })

  it('counts tournaments at or beyond knockout', () => {
    const entries = [
      { bestStageRank: STAGE_RANK['group-wins'] },
      { bestStageRank: STAGE_RANK['knockout'] },
      { bestStageRank: STAGE_RANK['quarter-final'] },
      { bestStageRank: STAGE_RANK['group-stages'] },
    ]
    expect(percentAtOrBeyondRank(entries, KNOCKOUT_OR_BETTER_MIN_RANK)).toBe(50)
  })
})

describe('progressionDepthBarSegments', () => {
  it('returns the UI ladder without a knockout slice', () => {
    const counts = new Map([
      ['knockout', 2],
      ['group-wins', 4],
    ] as const)
    const bar = progressionDepthBarSegments(counts, 6)
    expect(bar).toHaveLength(PROGRESSION_UI_STAGE_ORDER.length)
    expect(bar.map((row) => row.stage)).not.toContain('knockout')
    expect(bar.find((row) => row.stage === 'quarter-final')?.count).toBe(2)
    expect(bar.find((row) => row.stage === 'group-wins')?.percent).toBe(67)
  })
})

describe('progressionDistributionBar', () => {
  it('returns only non-zero UI stages, deepest first, with knockout merged into QF', () => {
    const counts = new Map([
      ['knockout', 2],
      ['group-wins', 4],
    ] as const)
    const bar = progressionDistributionBar(counts, 6)
    expect(bar.map((row) => row.stage)).toEqual(['quarter-final', 'group-wins'])
    expect(bar[0]?.count).toBe(2)
    expect(bar[1]?.percent).toBe(67)
  })
})

describe('progressionBarMarkerRankForUI', () => {
  it('maps knockout median onto the quarter-final segment', () => {
    expect(progressionBarMarkerRankForUI(STAGE_RANK['knockout'])).toBe(
      STAGE_RANK['quarter-final'],
    )
    expect(progressionBarMarkerRankForUI(STAGE_RANK['group-wins'])).toBe(
      STAGE_RANK['group-wins'],
    )
  })
})

function row(
  stage: ProgressionDistributionRow['stage'],
  percent: number,
  count = percent,
): ProgressionDistributionRow {
  return {
    stage,
    label: stage,
    shortLabel: stage,
    count,
    percent,
  }
}

describe('progressionDepthBarStageWeight', () => {
  it('pairs group stages and podium stages, halving between steps', () => {
    expect(progressionDepthBarStageWeight('group-stages')).toBe(
      progressionDepthBarStageWeight('group-wins'),
    )
    expect(progressionDepthBarStageWeight('runner-up')).toBe(
      progressionDepthBarStageWeight('winner'),
    )
    expect(progressionDepthBarStageWeight('quarter-final')).toBe(
      progressionDepthBarStageWeight('group-stages') / 2,
    )
    expect(progressionDepthBarStageWeight('semi-final')).toBe(
      progressionDepthBarStageWeight('quarter-final') / 2,
    )
  })
})

describe('progressionBarDisplayWidths', () => {
  it('uses a fixed halving ladder on the full UI scale', () => {
    const segments = PROGRESSION_UI_STAGE_ORDER.map((stage) => row(stage, 0, 0))
    const widths = progressionBarDisplayWidths(segments)
    expect(widths[0]).toBeCloseTo(widths[1]!, 5)
    expect(widths[4]).toBeCloseTo(widths[5]!, 5)
    expect(widths[0]!).toBeGreaterThan(widths[2]!)
    expect(widths[2]!).toBeGreaterThan(widths[3]!)
    expect(widths[3]!).toBeGreaterThan(widths[4]!)
    expect(widths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(100, 5)
  })

  it('does not shrink podium slices below the readable minimum', () => {
    const segments = PROGRESSION_UI_STAGE_ORDER.map((stage) => row(stage, 0, 0))
    const widths = progressionBarDisplayWidths(segments)
    expect(widths[4]!).toBeGreaterThanOrEqual(7)
    expect(widths[5]!).toBeGreaterThanOrEqual(7)
  })
})

describe('progressionBarMobileLabel', () => {
  it('uses Match wins when the slice is wide enough', () => {
    expect(progressionBarMobileLabel('group-wins', 12)).toBe('Match wins')
    expect(progressionBarMobileLabel('group-wins', 8)).toBe('Grp MW')
  })

  it('uses W for winner on the bar scale', () => {
    expect(progressionBarMobileLabel('winner', 8)).toBe('W')
  })
})

describe('progressionStageMarkerT', () => {
  it('anchors group exit left, middle stages centre, and winner right', () => {
    expect(progressionStageMarkerT(1)).toBe(0)
    expect(progressionStageMarkerT(2)).toBe(0.5)
    expect(progressionStageMarkerT(6)).toBe(0.5)
    expect(progressionStageMarkerT(7)).toBe(1)
  })
})

describe('progressionBarMarkerPercentFromTypicalRank', () => {
  it('places the marker on the left of the group segment when depth is always group exit', () => {
    const segments = [row('group-stages', 100)]
    const widths = progressionBarDisplayWidths(segments)
    expect(progressionBarMarkerPercentFromTypicalRank(1, segments, widths)).toBe(0)
  })

  it('places the marker in the centre of the match-wins segment', () => {
    const segments = [row('group-wins', 100)]
    const widths = progressionBarDisplayWidths(segments)
    expect(progressionBarMarkerPercentFromTypicalRank(2, segments, widths)).toBe(50)
  })

  it('places the marker on the right edge when depth is always winner', () => {
    const segments = [row('winner', 100)]
    const widths = progressionBarDisplayWidths(segments)
    expect(progressionBarMarkerPercentFromTypicalRank(7, segments, widths)).toBe(100)
  })

  it('centres the marker in the quarter-final segment on a six-step ladder', () => {
    const segments = [
      row('group-stages', 0, 0),
      row('group-wins', 0, 0),
      row('quarter-final', 100, 3),
      row('semi-final', 0, 0),
      row('runner-up', 0, 0),
      row('winner', 0, 0),
    ]
    const widths = progressionBarDisplayWidths(segments)
    const qfIndex = 2
    const qfStart = widths.slice(0, qfIndex).reduce((sum, width) => sum + width, 0)
    const qfCenter = qfStart + (widths[qfIndex] ?? 0) / 2
    expect(progressionBarMarkerPercentFromTypicalRank(4, segments, widths)).toBeCloseTo(
      qfCenter,
      1,
    )
  })
})

describe('medianRank', () => {
  it('returns the middle value for odd-length lists', () => {
    expect(medianRank([1, 3, 7])).toBe(3)
  })

  it('averages the two central values for even-length lists', () => {
    expect(medianRank([1, 2, 3, 4])).toBe(2.5)
  })
})
