import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import { compareMatchesChronologically, sortMatchesChronologically } from './matchChronology'

function makeMatch(overrides: Partial<NormalizedMatch> & Pick<NormalizedMatch, 'date'>): NormalizedMatch {
  return {
    competitionName: 'Test Event',
    tournamentCategory: 'open',
    tournamentCategoryLabel: 'Open',
    discipline: 'XD',
    disciplineLabel: 'Mixed doubles',
    playerName: 'Player',
    partnerName: 'Partner',
    opponents: overrides.opponents ?? 'Opponents',
    outcome: overrides.outcome ?? 'win',
    nonCompetitiveReason: null,
    scoreSummary: '21-15, 21-12',
    playerRating: overrides.playerRating ?? 600,
    raw: overrides.raw ?? { Round: 'Group A' },
    ...overrides,
  }
}

describe('matchChronology', () => {
  it('orders same-day matches by pre-match rating when upload order is reversed', () => {
    const laterInDay = makeMatch({
      date: '2026-01-17',
      opponents: 'Stronger pair',
      playerRating: 656,
      raw: { Round: 'Group A' },
    })
    const earlierInDay = makeMatch({
      date: '2026-01-17',
      opponents: 'Weaker pair',
      playerRating: 650,
      raw: { Round: 'Group A' },
    })

    const sorted = sortMatchesChronologically([laterInDay, earlierInDay])
    expect(sorted.map((m) => m.opponents)).toEqual(['Weaker pair', 'Stronger pair'])
  })

  it('orders same-day matches by tournament round before rating', () => {
    const quarterFinal = makeMatch({
      date: '2026-04-01',
      opponents: 'QF foes',
      playerRating: 620,
      raw: { Round: 'Quarter Final' },
    })
    const group = makeMatch({
      date: '2026-04-01',
      opponents: 'Group foes',
      playerRating: 640,
      raw: { Round: 'Group A' },
    })

    expect(compareMatchesChronologically(group, quarterFinal)).toBeLessThan(0)
  })
})
