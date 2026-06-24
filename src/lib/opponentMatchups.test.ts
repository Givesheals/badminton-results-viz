import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import {
  computeNemesisScore,
  computeOpponentMatchups,
  DEFAULT_MIN_MEETINGS,
  detectOpponentMatchupRecapMilestones,
  getHeadToHeadMatches,
  NEMESIS_PROXIMITY_SCALE,
  OPPONENT_MATCHUP_TOP_N,
} from './opponentMatchups'

function h2hMatch(
  overrides: Partial<NormalizedMatch> &
    Pick<NormalizedMatch, 'competitionName' | 'date' | 'outcome'>,
  opponentName: string,
  opponentRating: number,
  playerRating = 550,
): NormalizedMatch {
  return {
    tournamentCategory: 'bronze',
    tournamentCategoryLabel: 'Bronze',
    discipline: 'WS',
    disciplineLabel: "Women's singles",
    playerName: 'Alex',
    partnerName: null,
    opponents: opponentName,
    nonCompetitiveReason: null,
    scoreSummary: '21-15, 21-12',
    playerRating,
    raw: {
      'Opponent 1 Name': opponentName,
      'Opponent 1 Rating': opponentRating,
      'Opponent 2 Rating': null,
      'Player Game 1 Score': 21,
      'Opponent Game 1 Score': 15,
      'Player Game 2 Score': 21,
      'Opponent Game 2 Score': 12,
      'Player Game 3 Score': null,
      'Opponent Game 3 Score': null,
    },
    ...overrides,
    competitionName: overrides.competitionName,
    date: overrides.date,
    outcome: overrides.outcome,
  }
}

describe('computeOpponentMatchups', () => {
  it('excludes opponents with a winning head-to-head record', () => {
    const matches = [
      ...Array.from({ length: 5 }, (_, i) =>
        h2hMatch(
          { competitionName: 'A', date: `2025-01-0${i + 1}`, outcome: 'win' },
          'Beatable',
          560,
        ),
      ),
      ...Array.from({ length: 2 }, (_, i) =>
        h2hMatch(
          { competitionName: 'A', date: `2025-02-0${i + 1}`, outcome: 'loss' },
          'Beatable',
          560,
        ),
      ),
    ]

    const { nemeses } = computeOpponentMatchups(matches, DEFAULT_MIN_MEETINGS, 2)
    expect(nemeses.some((r) => r.opponentName === 'Beatable')).toBe(false)
  })

  it('excludes tied head-to-head records', () => {
    const matches = [
      h2hMatch({ competitionName: 'A', date: '2025-01-01', outcome: 'win' }, 'Rival', 560),
      h2hMatch({ competitionName: 'A', date: '2025-02-01', outcome: 'win' }, 'Rival', 560),
      h2hMatch({ competitionName: 'A', date: '2025-03-01', outcome: 'win' }, 'Rival', 560),
      h2hMatch({ competitionName: 'A', date: '2025-04-01', outcome: 'loss' }, 'Rival', 560),
      h2hMatch({ competitionName: 'A', date: '2025-05-01', outcome: 'loss' }, 'Rival', 560),
      h2hMatch({ competitionName: 'A', date: '2025-06-01', outcome: 'loss' }, 'Rival', 560),
    ]

    const { nemeses } = computeOpponentMatchups(matches, DEFAULT_MIN_MEETINGS, 2)
    expect(nemeses.some((r) => r.opponentName === 'Rival')).toBe(false)
  })

  it('includes opponents with more losses than wins', () => {
    const matches = [
      h2hMatch({ competitionName: 'A', date: '2025-01-01', outcome: 'loss' }, 'Nemesis', 555),
      h2hMatch({ competitionName: 'A', date: '2025-02-01', outcome: 'loss' }, 'Nemesis', 555),
      h2hMatch({ competitionName: 'A', date: '2025-03-01', outcome: 'loss' }, 'Nemesis', 555),
      h2hMatch({ competitionName: 'A', date: '2025-04-01', outcome: 'win' }, 'Nemesis', 555),
    ]

    const { nemeses } = computeOpponentMatchups(matches, DEFAULT_MIN_MEETINGS, 2)
    expect(nemeses[0]?.opponentName).toBe('Nemesis')
    expect(nemeses[0]?.losses).toBe(3)
    expect(nemeses[0]?.wins).toBe(1)
  })

  it('prefers nearer-rated nemeses when enough candidates exist', () => {
    const sharedLosses = Array.from({ length: 4 }, (_, i) =>
      h2hMatch(
        { competitionName: 'A', date: `2025-01-0${i + 1}`, outcome: 'loss' },
        'Close Rival',
        560,
        550,
      ),
    )
    const crusherLosses = Array.from({ length: 4 }, (_, i) =>
      h2hMatch(
        { competitionName: 'B', date: `2025-02-0${i + 1}`, outcome: 'loss' },
        'Far Crusher',
        700,
        550,
      ),
    )
    const fillers = [
      'Extra One',
      'Extra Two',
      'Extra Three',
      'Extra Four',
      'Extra Five',
    ].flatMap((name, idx) =>
      Array.from({ length: 3 }, (_, j) =>
        h2hMatch(
          {
            competitionName: 'F',
            date: `2024-${String(idx + 1).padStart(2, '0')}-${j + 1}`,
            outcome: 'loss',
          },
          name,
          555,
          550,
        ),
      ),
    )

    const { nemeses } = computeOpponentMatchups(
      [...sharedLosses, ...crusherLosses, ...fillers],
      3,
      2,
    )
    expect(nemeses.length).toBeGreaterThanOrEqual(OPPONENT_MATCHUP_TOP_N)
    const closeIndex = nemeses.findIndex((r) => r.opponentName === 'Close Rival')
    const farIndex = nemeses.findIndex((r) => r.opponentName === 'Far Crusher')
    expect(closeIndex).toBeGreaterThanOrEqual(0)
    expect(farIndex).toBeGreaterThanOrEqual(0)
    expect(closeIndex).toBeLessThan(farIndex)
  })

  it('ignores proximity when nemesisRatingProximity is false', () => {
    const closeRivalMatches = [
      ...Array.from({ length: 4 }, (_, i) =>
        h2hMatch(
          { competitionName: 'A', date: `2025-01-0${i + 1}`, outcome: 'loss' },
          'Close Rival',
          560,
          550,
        ),
      ),
      h2hMatch(
        { competitionName: 'A', date: '2025-01-05', outcome: 'win' },
        'Close Rival',
        560,
        550,
      ),
    ]
    const farCrusherMatches = [
      ...Array.from({ length: 5 }, (_, i) =>
        h2hMatch(
          { competitionName: 'B', date: `2025-02-0${i + 1}`, outcome: 'loss' },
          'Far Crusher',
          700,
          550,
        ),
      ),
      h2hMatch(
        { competitionName: 'B', date: '2025-02-06', outcome: 'win' },
        'Far Crusher',
        700,
        550,
      ),
    ]
    const fillers = [
      'Extra One',
      'Extra Two',
      'Extra Three',
      'Extra Four',
      'Extra Five',
    ].flatMap((name, idx) =>
      Array.from({ length: 3 }, (_, j) =>
        h2hMatch(
          {
            competitionName: 'F',
            date: `2024-${String(idx + 1).padStart(2, '0')}-${j + 1}`,
            outcome: 'loss',
          },
          name,
          555,
          550,
        ),
      ),
    )

    const withProximity = computeOpponentMatchups(
      [...closeRivalMatches, ...farCrusherMatches, ...fillers],
      3,
      2,
      true,
    )
    const withoutProximity = computeOpponentMatchups(
      [...closeRivalMatches, ...farCrusherMatches, ...fillers],
      3,
      2,
      false,
    )

    const closeWith = withProximity.nemeses.findIndex(
      (r) => r.opponentName === 'Close Rival',
    )
    const farWith = withProximity.nemeses.findIndex(
      (r) => r.opponentName === 'Far Crusher',
    )
    expect(closeWith).toBeGreaterThanOrEqual(0)
    expect(farWith).toBeGreaterThanOrEqual(0)
    expect(closeWith).toBeLessThan(farWith)

    const closeWithout = withoutProximity.nemeses.findIndex(
      (r) => r.opponentName === 'Close Rival',
    )
    const farWithout = withoutProximity.nemeses.findIndex(
      (r) => r.opponentName === 'Far Crusher',
    )
    expect(closeWithout).toBeGreaterThanOrEqual(0)
    expect(farWithout).toBeGreaterThanOrEqual(0)
    expect(farWithout).toBeLessThan(closeWithout)
  })

  it('ignores proximity when fewer than five nemesis candidates', () => {
    const matches = [
      ...Array.from({ length: 4 }, (_, i) =>
        h2hMatch(
          { competitionName: 'A', date: `2025-01-0${i + 1}`, outcome: 'loss' },
          'Far Crusher',
          700,
          550,
        ),
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        h2hMatch(
          { competitionName: 'B', date: `2025-02-0${i + 1}`, outcome: 'loss' },
          'Close Rival',
          558,
          550,
        ),
      ),
    ]

    const { nemeses } = computeOpponentMatchups(matches, 3, 2)
    expect(nemeses.length).toBe(2)
    expect(nemeses[0]?.opponentName).toBe('Far Crusher')
    expect(nemeses[1]?.opponentName).toBe('Close Rival')
  })

  it('excludes favourite opponents with a losing head-to-head record', () => {
    const matches = [
      ...Array.from({ length: 3 }, (_, i) =>
        h2hMatch(
          { competitionName: 'A', date: `2025-01-0${i + 1}`, outcome: 'win' },
          'Summer Pearson',
          600,
          550,
        ),
      ),
      ...Array.from({ length: 14 }, (_, i) =>
        h2hMatch(
          {
            competitionName: 'B',
            date: `2025-02-${String(i + 1).padStart(2, '0')}`,
            outcome: 'loss',
          },
          'Summer Pearson',
          600,
          550,
        ),
      ),
    ]

    const { scalps } = computeOpponentMatchups(matches, DEFAULT_MIN_MEETINGS, 2)
    expect(scalps.some((r) => r.opponentName === 'Summer Pearson')).toBe(false)
  })

  it('includes favourite opponents with an even head-to-head record', () => {
    const matches = [
      h2hMatch({ competitionName: 'A', date: '2025-01-01', outcome: 'win' }, 'Even Rival', 600, 550),
      h2hMatch({ competitionName: 'A', date: '2025-02-01', outcome: 'win' }, 'Even Rival', 610, 550),
      h2hMatch({ competitionName: 'A', date: '2025-03-01', outcome: 'loss' }, 'Even Rival', 600, 550),
      h2hMatch({ competitionName: 'A', date: '2025-04-01', outcome: 'loss' }, 'Even Rival', 610, 550),
    ]

    const { scalps } = computeOpponentMatchups(matches, DEFAULT_MIN_MEETINGS, 2)
    expect(scalps.some((r) => r.opponentName === 'Even Rival')).toBe(true)
  })
})

describe('computeNemesisScore', () => {
  it('applies proximity from avg loss rating gap', () => {
    const withProximity = computeNemesisScore(
      { losses: 4, games: 5, avgLossRatingGap: 50 },
      true,
    )
    const withoutProximity = computeNemesisScore(
      { losses: 4, games: 5, avgLossRatingGap: 50 },
      false,
    )
    expect(withoutProximity).toBeCloseTo(3.2)
    expect(withProximity).toBeCloseTo(3.2 * Math.exp(-50 / NEMESIS_PROXIMITY_SCALE))
    expect(withProximity).toBeLessThan(withoutProximity)
  })
})

describe('getHeadToHeadMatches', () => {
  it('returns only competitive meetings vs the opponent, newest first', () => {
    const matches = [
      h2hMatch({ competitionName: 'Old', date: '2025-01-01', outcome: 'loss' }, 'Target', 560),
      h2hMatch({ competitionName: 'New', date: '2026-01-01', outcome: 'win' }, 'Target', 560),
      h2hMatch({ competitionName: 'Other', date: '2026-02-01', outcome: 'win' }, 'Someone', 560),
    ]

    const h2h = getHeadToHeadMatches(matches, 'Target')
    expect(h2h).toHaveLength(2)
    expect(h2h[0]?.date).toBe('2026-01-01')
    expect(h2h[1]?.date).toBe('2025-01-01')
  })
})

describe('detectOpponentMatchupRecapMilestones', () => {
  it('detects a new nemesis top-5 entry after this weekend', () => {
    const prior = [
      h2hMatch(
        { competitionName: 'Old', date: '2025-01-01', outcome: 'loss' },
        'Nemesis One',
        600,
      ),
      h2hMatch(
        { competitionName: 'Old', date: '2025-02-01', outcome: 'loss' },
        'Nemesis One',
        600,
      ),
      h2hMatch(
        { competitionName: 'Old', date: '2025-03-01', outcome: 'loss' },
        'Nemesis One',
        600,
      ),
      h2hMatch(
        { competitionName: 'Old', date: '2025-04-01', outcome: 'loss' },
        'Nemesis Two',
        580,
      ),
      h2hMatch(
        { competitionName: 'Old', date: '2025-05-01', outcome: 'loss' },
        'Nemesis Two',
        580,
      ),
      h2hMatch(
        { competitionName: 'Old', date: '2025-06-01', outcome: 'loss' },
        'Nemesis Two',
        580,
      ),
    ]
    const weekend = [
      h2hMatch(
        { competitionName: 'Cup', date: '2026-03-01', outcome: 'loss' },
        'Fresh Nemesis',
        590,
      ),
      h2hMatch(
        { competitionName: 'Cup', date: '2026-03-02', outcome: 'loss' },
        'Fresh Nemesis',
        590,
      ),
      h2hMatch(
        { competitionName: 'Cup', date: '2026-03-03', outcome: 'loss' },
        'Fresh Nemesis',
        590,
      ),
      h2hMatch(
        { competitionName: 'Cup', date: '2026-03-04', outcome: 'loss' },
        'Fresh Nemesis',
        590,
      ),
    ]

    const milestones = detectOpponentMatchupRecapMilestones(weekend, prior)
    const nemesis = milestones.find((m) => m.kind === 'nemesis')
    expect(nemesis?.opponentName).toBe('Fresh Nemesis')
    expect(nemesis?.rank).toBeGreaterThan(0)
    expect(nemesis?.rank).toBeLessThanOrEqual(5)
  })

  it('detects a new scalp top-5 entry after rated upset wins', () => {
    const prior: NormalizedMatch[] = []
    const weekend = [
      h2hMatch(
        { competitionName: 'Cup', date: '2026-03-01', outcome: 'win' },
        'Scalp Target',
        620,
        560,
      ),
      h2hMatch(
        { competitionName: 'Cup', date: '2026-03-02', outcome: 'win' },
        'Scalp Target',
        615,
        560,
      ),
      h2hMatch(
        { competitionName: 'Cup', date: '2026-03-03', outcome: 'win' },
        'Scalp Target',
        610,
        560,
      ),
    ]

    const scalp = detectOpponentMatchupRecapMilestones(weekend, prior).find(
      (m) => m.kind === 'scalp',
    )
    expect(scalp?.opponentName).toBe('Scalp Target')
    expect(scalp?.rank).toBe(1)
  })
})
