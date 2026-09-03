import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import { latestRatingsByDisciplineFamily } from './ratings'

function makeMatch(overrides: Partial<NormalizedMatch>): NormalizedMatch {
  return {
    competitionName: 'Test Open',
    tournamentCategory: 'bronze',
    tournamentCategoryLabel: 'Bronze',
    date: '2025-01-01',
    discipline: 'OS',
    disciplineLabel: 'Open singles',
    playerName: 'Alex',
    partnerName: null,
    opponents: 'Opp',
    outcome: 'win',
    nonCompetitiveReason: null,
    scoreSummary: '21-18, 21-17',
    playerRating: 600,
    raw: {},
    ...overrides,
  }
}

describe('latestRatingsByDisciplineFamily', () => {
  it('uses the most recent match in each discipline family', () => {
    const ratings = latestRatingsByDisciplineFamily([
      makeMatch({ discipline: 'OS', date: '2025-01-01', playerRating: 500 }),
      makeMatch({ discipline: 'OS', date: '2025-06-01', playerRating: 524 }),
      makeMatch({ discipline: 'OD', date: '2025-03-01', playerRating: 610 }),
      makeMatch({ discipline: 'XD', date: '2025-04-01', playerRating: 540 }),
    ])

    expect(ratings).toEqual({ singles: 524, doubles: 610, mixed: 540 })
  })

  it('skips matches with no rating', () => {
    const ratings = latestRatingsByDisciplineFamily([
      makeMatch({ discipline: 'OS', playerRating: null }),
    ])
    expect(ratings.singles).toBeNull()
  })
})
