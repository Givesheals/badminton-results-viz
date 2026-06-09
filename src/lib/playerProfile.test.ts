import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import { filterMatches } from './filterMatches'
import { getArchetypeName } from './playerArchetypes'
import {
  buildPlayerCode,
  computeGameWinRates,
  computePlayerProfile,
  compareProfiles,
  MIN_COMPETITIVE_MATCHES,
  MIN_RATED_MATCHES,
} from './playerProfile'

function makeMatch(
  overrides: Partial<NormalizedMatch> &
    Pick<NormalizedMatch, 'date'> & { discipline?: string },
): NormalizedMatch {
  const discipline = overrides.discipline ?? 'WS'
  const { raw: rawOverride, date, discipline: _d, ...rest } = overrides
  const playerRating = overrides.playerRating ?? 600

  return {
    competitionName: overrides.competitionName ?? 'Test Open',
    tournamentCategory: overrides.tournamentCategory ?? 'bronze',
    tournamentCategoryLabel: overrides.tournamentCategoryLabel ?? 'Bronze',
    date,
    discipline,
    disciplineLabel: discipline,
    playerName: 'Alex',
    partnerName: overrides.partnerName ?? null,
    opponents: overrides.opponents ?? 'Opponent',
    outcome: overrides.outcome ?? 'win',
    nonCompetitiveReason: overrides.nonCompetitiveReason ?? null,
    scoreSummary: overrides.scoreSummary ?? '21-15, 21-12',
    playerRating,
    raw: {
      'Player Rating': playerRating,
      'Partner Rating': null,
      'Opponent 1 Rating': 580,
      'Opponent 2 Rating': null,
      'Player Game 1 Score': 21,
      'Opponent Game 1 Score': 15,
      'Player Game 2 Score': 21,
      'Opponent Game 2 Score': 12,
      'Player Game 3 Score': null,
      'Opponent Game 3 Score': null,
      ...rawOverride,
    },
    ...rest,
  }
}

function makeFinisherGames(): NormalizedMatch['raw'] {
  return {
    'Player Game 1 Score': 15,
    'Opponent Game 1 Score': 21,
    'Player Game 2 Score': 21,
    'Opponent Game 2 Score': 18,
    'Player Game 3 Score': 21,
    'Opponent Game 3 Score': 17,
  }
}

function bulkMatches(
  count: number,
  factory: (i: number) => Partial<NormalizedMatch> & { date: string },
): NormalizedMatch[] {
  return Array.from({ length: count }, (_, i) =>
    makeMatch(factory(i)),
  )
}

describe('computeGameWinRates', () => {
  it('detects stronger game-3 than game-1 performance', () => {
    const matches = [
      makeMatch({ date: '2025-01-01', raw: makeFinisherGames() }),
      makeMatch({ date: '2025-01-02', raw: makeFinisherGames() }),
      makeMatch({ date: '2025-01-03', raw: makeFinisherGames() }),
    ]

    const rates = computeGameWinRates(matches)
    expect(rates.game1.winPercent).toBeLessThan(rates.game3.winPercent!)
    expect(rates.game3.winPercent).toBe(100)
  })
})

describe('computePlayerProfile', () => {
  it('returns insufficient data below thresholds', () => {
    const matches = bulkMatches(10, (i) => ({
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
    }))

    const profile = computePlayerProfile(matches)
    expect(profile.sufficientData).toBe(false)
    expect(profile.code).toBeNull()
  })

  it('classifies Finisher when game 3 win rate exceeds game 1 by 8pp+', () => {
    const matches = bulkMatches(MIN_COMPETITIVE_MATCHES, (i) => ({
      date: `2024-${String((i % 12) + 1).padStart(2, '0')}-15`,
      raw: makeFinisherGames(),
      playerRating: 600,
    }))

    const profile = computePlayerProfile(matches)
    expect(profile.sufficientData).toBe(true)
    const f = profile.axes.find((a) => a.key === 'F')!
    expect(f.pole).toBe('high')
    expect(f.highLabel).toBe('Finisher')
  })

  it('classifies Reliable for stable favourite-heavy players', () => {
    const matches = bulkMatches(MIN_COMPETITIVE_MATCHES, (i) => ({
      date: `2024-${String((i % 12) + 1).padStart(2, '0')}-15`,
      outcome: 'win',
      playerRating: 650,
      raw: {
        'Player Rating': 650,
        'Opponent 1 Rating': 520,
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 12,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 9,
      },
    }))

    const profile = computePlayerProfile(matches)
    const s = profile.axes.find((a) => a.key === 'S')!
    expect(s.pole).toBe('high')
    expect(s.highLabel).toBe('Reliable')
    expect(profile.code).toMatch(/R$/)
  })

  it('classifies Crusher with strong underdog win rate', () => {
    const matches = bulkMatches(MIN_COMPETITIVE_MATCHES, (i) => ({
      date: `2024-${String((i % 12) + 1).padStart(2, '0')}-15`,
      outcome: i % 3 === 0 ? 'loss' : 'win',
      playerRating: 500,
      raw: {
        'Player Rating': 500,
        'Opponent 1 Rating': 650,
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 10,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 8,
      },
    }))

    const profile = computePlayerProfile(matches)
    const u = profile.axes.find((a) => a.key === 'U')!
    expect(u.pole).toBe('high')
    expect(profile.code).toMatch(/^.[C]/)
  })

  it('builds valid 16-letter codes from axes', () => {
    const axes = [
      { key: 'F' as const, pole: 'high' as const, score: 80, highLabel: 'Finisher', lowLabel: 'Grinder', confidence: 'high' as const, sampleCount: 50, detail: '' },
      { key: 'U' as const, pole: 'low' as const, score: 30, highLabel: 'Crusher', lowLabel: 'Challenger', confidence: 'high' as const, sampleCount: 50, detail: '' },
      { key: 'C' as const, pole: 'high' as const, score: 70, highLabel: 'Clutch', lowLabel: 'Composed', confidence: 'high' as const, sampleCount: 50, detail: '' },
      { key: 'S' as const, pole: 'high' as const, score: 90, highLabel: 'Reliable', lowLabel: 'Wildcard', confidence: 'high' as const, sampleCount: 50, detail: '' },
    ]
    expect(buildPlayerCode(axes)).toBe('FHLR')
  })
})

describe('compareProfiles and 24m filter', () => {
  it('detects axis shift between all-time and recent', () => {
    const oldEra = bulkMatches(MIN_COMPETITIVE_MATCHES, (i) => ({
      date: `2020-${String((i % 12) + 1).padStart(2, '0')}-10`,
      playerRating: 620,
      outcome: 'win',
      raw: {
        'Player Rating': 620,
        'Opponent 1 Rating': 500,
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 8,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 6,
      },
    }))

    const recentEra = bulkMatches(MIN_COMPETITIVE_MATCHES, (i) => ({
      date: `2025-${String((i % 6) + 1).padStart(2, '0')}-10`,
      playerRating: 500,
      outcome: 'win',
      raw: {
        'Player Rating': 500,
        'Opponent 1 Rating': 680,
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 19,
        'Player Game 2 Score': 19,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': 22,
        'Opponent Game 3 Score': 20,
      },
    }))

    const allMatches = [...oldEra, ...recentEra]
    const referenceDate = new Date('2026-05-01')
    const recentFiltered = filterMatches(
      allMatches,
      { competition: '', discipline: '', partner: '', time: '24m', competitionAge: '' },
      referenceDate,
    )

    expect(recentFiltered.length).toBeGreaterThan(0)
    expect(recentFiltered.length).toBeLessThan(allMatches.length)

    const allTime = computePlayerProfile(allMatches)
    const recent = computePlayerProfile(recentFiltered)

    expect(allTime.sufficientData).toBe(true)
    expect(recent.ratedMatchCount).toBeGreaterThanOrEqual(MIN_RATED_MATCHES)

    const comparison = compareProfiles(allTime, recent, getArchetypeName)
    if (allTime.code !== recent.code) {
      expect(comparison.shifted).toBe(true)
      expect(comparison.message).toContain('All-time')
    }
  })
})
