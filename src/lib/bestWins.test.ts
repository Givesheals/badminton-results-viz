import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import {
  computeBestWins,
  detectBestWinRecapMilestones,
  findBiggestUpsetInMatches,
  findBigUpsetWinsInMatches,
  BIG_UPSET_MIN_RATING_GAP,
  findBestWinInMatches,
  selectUpsetRows,
  selectUpsetRowsExcludingStrength,
  type BestWinRow,
} from './bestWins'

function ratedWin(
  overrides: Partial<NormalizedMatch> &
    Pick<NormalizedMatch, 'competitionName' | 'date' | 'opponents'>,
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
    outcome: 'win',
    nonCompetitiveReason: null,
    scoreSummary: '21-15, 21-12',
    playerRating,
    raw: {
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
    opponents: overrides.opponents,
  }
}

function winRow(
  match: NormalizedMatch,
  opponentRating: number,
  playerRating = 550,
): BestWinRow {
  return {
    match,
    ourTeamRating: playerRating,
    opponentTeamRating: opponentRating,
    ratingGap: opponentRating - playerRating,
    preMatchWinChancePercent: 0,
    expectedWinPercent: null,
  }
}

describe('computeBestWins', () => {
  it('excludes wins with no game scores or non-score finishes', () => {
    const played = ratedWin(
      { competitionName: 'Cup', date: '2026-01-01', opponents: 'Played' },
      620,
    )
    const noScores = ratedWin(
      {
        competitionName: 'Cup',
        date: '2026-01-02',
        opponents: 'No scores',
        scoreSummary: '—',
        raw: {
          'Opponent 1 Rating': 650,
          'Opponent 2 Rating': null,
          'Player Game 1 Score': null,
          'Opponent Game 1 Score': null,
          'Player Game 2 Score': null,
          'Opponent Game 2 Score': null,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      },
      650,
    )
    const walkover = ratedWin(
      {
        competitionName: 'Cup',
        date: '2026-01-03',
        opponents: 'Walkover',
        scoreSummary: 'Walkover win',
        nonCompetitiveReason: 'walkover',
        outcome: 'unknown',
        raw: {
          'Opponent 1 Rating': 700,
          'Opponent 2 Rating': null,
          'Score Text': 'Walkover win',
          'Player Game 1 Score': null,
          'Opponent Game 1 Score': null,
          'Player Game 2 Score': null,
          'Opponent Game 2 Score': null,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      },
      700,
    )
    const retired = ratedWin(
      {
        competitionName: 'Cup',
        date: '2026-01-04',
        opponents: 'Retired',
        scoreSummary: 'Retired',
        raw: {
          'Opponent 1 Rating': 680,
          'Opponent 2 Rating': null,
          'Score Text': 'Retired',
          'Player Game 1 Score': null,
          'Opponent Game 1 Score': null,
          'Player Game 2 Score': null,
          'Opponent Game 2 Score': null,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      },
      680,
    )
    const noMatch = ratedWin(
      {
        competitionName: 'Cup',
        date: '2026-01-05',
        opponents: 'No match',
        scoreSummary: 'No match',
        nonCompetitiveReason: 'no_match',
        outcome: 'unknown',
        raw: {
          'Opponent 1 Rating': 690,
          'Opponent 2 Rating': null,
          'Score Text': 'No match',
          'Player Game 1 Score': null,
          'Opponent Game 1 Score': null,
          'Player Game 2 Score': null,
          'Opponent Game 2 Score': null,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      },
      690,
    )

    const result = computeBestWins([
      played,
      noScores,
      walkover,
      retired,
      noMatch,
    ])

    expect(result.byOpponentStrength).toHaveLength(1)
    expect(result.byOpponentStrength[0]!.match.opponents).toBe('Played')
    expect(result.byUpset).toHaveLength(1)
    expect(result.byUpset[0]!.match.opponents).toBe('Played')
  })

  it('excludes walkover wins that still have numeric game scores in the sheet', () => {
    const walkoverWithScores = ratedWin(
      {
        competitionName: 'Cup',
        date: '2026-01-01',
        opponents: 'Walkover',
        scoreSummary: 'Walkover win',
        raw: {
          'Opponent 1 Rating': 700,
          'Opponent 2 Rating': null,
          'Score Text': 'Walkover win',
          'Player Game 1 Score': 21,
          'Opponent Game 1 Score': 0,
          'Player Game 2 Score': 21,
          'Opponent Game 2 Score': 0,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      },
      700,
    )

    expect(computeBestWins([walkoverWithScores]).ratedWinCount).toBe(0)
  })
})

describe('findBigUpsetWinsInMatches', () => {
  it('returns all wins where the opponent was at least 30 pts higher', () => {
    const belowThreshold = ratedWin(
      { competitionName: 'Cup', date: '2026-01-01', opponents: 'Mild' },
      575,
      550,
    )
    const big = ratedWin(
      { competitionName: 'Cup', date: '2026-01-02', opponents: 'Giant' },
      650,
      540,
    )
    const notBigEnough = ratedWin(
      { competitionName: 'Cup', date: '2026-01-03', opponents: 'Close' },
      570,
      550,
    )

    expect(
      findBigUpsetWinsInMatches([belowThreshold, big, notBigEnough]).map(
        (r) => r.match.opponents,
      ),
    ).toEqual(['Giant'])
    expect(BIG_UPSET_MIN_RATING_GAP).toBe(30)
  })
})

describe('findBiggestUpsetInMatches', () => {
  it('returns the win with the largest rating gap when underdog', () => {
    const mild = ratedWin(
      { competitionName: 'Cup', date: '2026-01-01', opponents: 'Mild' },
      580,
      550,
    )
    const big = ratedWin(
      { competitionName: 'Cup', date: '2026-01-02', opponents: 'Giant' },
      650,
      540,
    )
    const result = findBiggestUpsetInMatches([mild, big])
    expect(result?.match.opponents).toBe('Giant')
    expect(result?.ratingGap).toBe(110)
  })

  it('returns null when all wins were as favourite', () => {
    const favourite = ratedWin(
      { competitionName: 'Cup', date: '2026-01-01', opponents: 'Weaker' },
      500,
      600,
    )
    expect(findBiggestUpsetInMatches([favourite])).toBeNull()
  })

  it('prefers a later date when rating gaps tie', () => {
    const earlier = ratedWin(
      { competitionName: 'Cup', date: '2026-01-01', opponents: 'Earlier' },
      620,
      550,
    )
    const later = ratedWin(
      { competitionName: 'Cup', date: '2026-02-01', opponents: 'Later' },
      620,
      550,
    )
    expect(findBiggestUpsetInMatches([earlier, later])?.match.opponents).toBe(
      'Later',
    )
  })
})

describe('findBestWinInMatches', () => {
  it('returns the win against the highest-rated opponent', () => {
    const mild = ratedWin(
      { competitionName: 'Cup', date: '2026-01-01', opponents: 'Mild' },
      580,
      550,
    )
    const strong = ratedWin(
      { competitionName: 'Cup', date: '2026-01-02', opponents: 'Strong' },
      650,
      540,
    )
    expect(findBestWinInMatches([mild, strong])?.match.opponents).toBe('Strong')
  })
})

describe('selectUpsetRowsExcludingStrength', () => {
  it('skips upset rows that appear in the strongest-beaten top N', () => {
    const shared = ratedWin(
      { competitionName: 'Cup', date: '2026-01-01', opponents: 'Star' },
      700,
      550,
    )
    const otherUpset = ratedWin(
      { competitionName: 'Cup', date: '2026-02-01', opponents: 'Underdog' },
      620,
      550,
    )
    const strength = [winRow(shared, 700)]
    const upset = [
      winRow(shared, 700),
      winRow(otherUpset, 620),
    ]

    expect(
      selectUpsetRowsExcludingStrength(strength, upset, 1).map(
        (r) => r.match.opponents,
      ),
    ).toEqual(['Underdog'])
  })
})

describe('selectUpsetRows', () => {
  it('includes strongest-beaten rows when excludeStrengthDuplicates is false', () => {
    const shared = ratedWin(
      { competitionName: 'Cup', date: '2026-01-01', opponents: 'Star' },
      700,
      550,
    )
    const otherUpset = ratedWin(
      { competitionName: 'Cup', date: '2026-02-01', opponents: 'Underdog' },
      620,
      550,
    )
    const strength = [winRow(shared, 700)]
    const upset = [winRow(shared, 700), winRow(otherUpset, 620)]

    expect(
      selectUpsetRows(strength, upset, 1, { excludeStrengthDuplicates: false }).map(
        (r) => r.match.opponents,
      ),
    ).toEqual(['Star'])
  })
})

describe('detectBestWinRecapMilestones', () => {
  it('detects new strongest beaten rank at this event', () => {
    const prior = [
      ratedWin(
        { competitionName: 'Old', date: '2025-01-01', opponents: 'A' },
        600,
      ),
      ratedWin(
        { competitionName: 'Old', date: '2025-02-01', opponents: 'B' },
        620,
      ),
    ]
    const weekend = [
      ratedWin(
        { competitionName: 'Cup', date: '2026-03-01', opponents: 'C' },
        640,
      ),
    ]

    const milestones = detectBestWinRecapMilestones(weekend, prior)
    const strength = milestones.find((m) => m.kind === 'strength')!
    expect(strength.rank).toBe(1)
    expect(strength.row.match.opponents).toBe('C')
  })

  it('detects moving into 3rd all time without hitting #1', () => {
    const prior = [
      ratedWin(
        { competitionName: 'Old', date: '2025-01-01', opponents: 'A' },
        650,
      ),
      ratedWin(
        { competitionName: 'Old', date: '2025-02-01', opponents: 'B' },
        630,
      ),
      ratedWin(
        { competitionName: 'Old', date: '2025-03-01', opponents: 'C' },
        610,
      ),
    ]
    const weekend = [
      ratedWin(
        { competitionName: 'Cup', date: '2026-03-01', opponents: 'D' },
        620,
      ),
    ]

    const strength = detectBestWinRecapMilestones(weekend, prior).find(
      (m) => m.kind === 'strength',
    )!
    expect(strength.rank).toBe(3)
  })

  it('ignores wins outside the all-time top 5', () => {
    const prior = Array.from({ length: 6 }, (_, i) =>
      ratedWin(
        {
          competitionName: 'Old',
          date: `2025-01-0${i + 1}`,
          opponents: `Opp ${i}`,
        },
        700 - i,
      ),
    )
    const weekend = [
      ratedWin(
        { competitionName: 'Cup', date: '2026-03-01', opponents: 'Weak' },
        640,
      ),
    ]

    expect(detectBestWinRecapMilestones(weekend, prior)).toHaveLength(0)
  })

  it('ignores weekend wins that do not improve all-time rank', () => {
    const prior = [
      ratedWin(
        { competitionName: 'Old', date: '2025-01-01', opponents: 'A' },
        650,
      ),
    ]
    const weekend = [
      ratedWin(
        { competitionName: 'Cup', date: '2026-03-01', opponents: 'B' },
        600,
      ),
    ]

    expect(detectBestWinRecapMilestones(weekend, prior)).toHaveLength(0)
  })
})
