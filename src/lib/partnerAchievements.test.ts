import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import {
  computePartnerHighlightScore,
  formatStageChip,
  partnerCompetitionFilterOptions,
  partnerFilterOptions,
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

describe('formatStageChip', () => {
  it('uses full stage titles by default', () => {
    expect(formatStageChip('quarter-final', 4)).toBe('4× Quarter-final')
    expect(formatStageChip('group-wins', 15)).toBe('15× Group match wins')
  })

  it('uses tournament progression short titles when compact', () => {
    expect(formatStageChip('quarter-final', 4, true)).toBe('4× QF')
    expect(formatStageChip('group-wins', 15, true)).toBe('15× Grp MW')
    expect(formatStageChip('runner-up', 2, true)).toBe('2× 2nd')
  })
})

function categoryMatch(category: string): NormalizedMatch {
  return {
    competitionName: `${category} event`,
    tournamentCategory: category,
    tournamentCategoryLabel: category,
    date: '2026-01-01',
    discipline: 'MD',
    disciplineLabel: 'MD',
    playerName: 'Alex',
    partnerName: 'Sam',
    opponents: 'Opponents',
    outcome: 'win',
    nonCompetitiveReason: null,
    scoreSummary: '21-15',
    playerRating: 570,
    raw: { 'Tournament Category': category },
  }
}

describe('partnerCompetitionFilterOptions', () => {
  it('orders copper through para and omits county', () => {
    const options = partnerCompetitionFilterOptions([
      categoryMatch('gold'),
      categoryMatch('para'),
      categoryMatch('N/A'),
      categoryMatch('bronze'),
      categoryMatch('other'),
      categoryMatch('copper'),
      categoryMatch('silver'),
      categoryMatch('county'),
    ])

    expect(options.map((option) => option.label)).toEqual([
      'Copper',
      'Bronze',
      'Silver',
      'Gold',
      'Other',
      'Para',
    ])
  })
})

describe('partnerFilterOptions', () => {
  it('lists partners alphabetically by first name, not highlight rank', () => {
    const options = partnerFilterOptions({
      totalPartnerCount: 3,
      partners: [
        row({ partnerName: 'Neil Place', eventCount: 36 }),
        row({ partnerName: 'Chris Vale', eventCount: 12 }),
        row({ partnerName: 'Alisha Johnson', eventCount: 4 }),
      ],
    })

    expect(options.map((option) => option.label)).toEqual([
      'Alisha Johnson',
      'Chris Vale',
      'Neil Place',
    ])
  })
})
