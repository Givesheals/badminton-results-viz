import { describe, expect, it } from 'vitest'
import {
  computePartnerHighlightScore,
  type PartnerAchievementRow,
} from './partnerAchievements'

function row(
  overrides: Partial<PartnerAchievementRow> & Pick<PartnerAchievementRow, 'partnerName'>,
): PartnerAchievementRow {
  const {
    partnerName,
    eventCount = 1,
    maxStageRank = 1,
    typicalRank = 1,
    highlightScore = computePartnerHighlightScore(eventCount, maxStageRank, typicalRank),
    stageCounts = {},
    typicalLabel = null,
    podiumCount = 0,
  } = overrides
  return {
    partnerName,
    eventCount,
    stageCounts,
    typicalRank,
    typicalLabel,
    maxStageRank,
    highlightScore,
    podiumCount,
  }
}

describe('computePartnerHighlightScore', () => {
  it('ranks high volume shallow above moderate volume deep', () => {
    const highVolumeShallow = computePartnerHighlightScore(100, 2, 2)
    const moderateDeep = computePartnerHighlightScore(10, 6, 5.5)
    const moderateShallow = computePartnerHighlightScore(20, 1, 1)

    expect(highVolumeShallow).toBeGreaterThan(moderateDeep)
    expect(moderateDeep).toBeGreaterThan(moderateShallow)
  })

  it('ranks deeper partners higher when event counts match', () => {
    const deep = computePartnerHighlightScore(10, 6, 5.5)
    const shallow = computePartnerHighlightScore(10, 1, 1)

    expect(deep).toBeGreaterThan(shallow)
  })

  it('gives single-event partners the lowest score among comparable depth', () => {
    const single = computePartnerHighlightScore(1, 3, 3)
    const several = computePartnerHighlightScore(5, 3, 3)

    expect(single).toBeLessThan(several)
  })
})

describe('partner highlight ordering (score fields)', () => {
  it('sorts rows by highlightScore descending', () => {
    const rows = [
      row({ partnerName: 'C', eventCount: 20, maxStageRank: 1, typicalRank: 1 }),
      row({ partnerName: 'B', eventCount: 10, maxStageRank: 6, typicalRank: 5.5 }),
      row({ partnerName: 'A', eventCount: 100, maxStageRank: 2, typicalRank: 2 }),
    ]

    const sorted = [...rows].sort((a, b) => b.highlightScore - a.highlightScore)

    expect(sorted.map((r) => r.partnerName)).toEqual(['A', 'B', 'C'])
  })
})
