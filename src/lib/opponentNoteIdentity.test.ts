import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import {
  countMeetingsByOpponentName,
  formatOpponentGroupMeta,
  prototypeDisciplineRatings,
  u19CircuitBandForRating,
} from './opponentNoteIdentity'

function makeMatch(
  overrides: Partial<NormalizedMatch> & {
    opponent1?: string
    opponent2?: string | null
  } = {},
): NormalizedMatch {
  const { opponent1 = 'Smith', opponent2 = null, ...rest } = overrides
  const opponents =
    opponent2 != null && opponent2 !== '' ? `${opponent1} & ${opponent2}` : opponent1
  return {
    competitionName: 'Open',
    tournamentCategory: 'bronze',
    tournamentCategoryLabel: 'Bronze',
    date: '2026-03-01',
    discipline: 'MS',
    disciplineLabel: "Men's singles",
    playerName: 'Alex',
    partnerName: null,
    opponents,
    outcome: 'win',
    nonCompetitiveReason: null,
    scoreSummary: '21-15, 21-12',
    playerRating: 600,
    raw: {
      'Opponent 1 Name': opponent1,
      'Opponent 2 Name': opponent2,
    },
    ...rest,
    opponents: rest.opponents ?? opponents,
    raw: rest.raw ?? {
      'Opponent 1 Name': opponent1,
      'Opponent 2 Name': opponent2,
    },
  }
}

describe('u19CircuitBandForRating', () => {
  it('maps U19 bronze / silver / gold cut-offs', () => {
    expect(u19CircuitBandForRating(500)).toBe('bronze')
    expect(u19CircuitBandForRating(600)).toBe('bronze')
    expect(u19CircuitBandForRating(601)).toBe('silver')
    expect(u19CircuitBandForRating(650)).toBe('silver')
    expect(u19CircuitBandForRating(651)).toBe('gold')
    expect(u19CircuitBandForRating(800)).toBe('gold')
  })
})

describe('prototypeDisciplineRatings', () => {
  it('returns three ratings in 500–800 that stay stable for a name', () => {
    const first = prototypeDisciplineRatings('ChengMin Yuan')
    const second = prototypeDisciplineRatings('  chengmin yuan  ')
    expect(first).toEqual(second)
    expect(first).toHaveLength(3)
    for (const rating of first) {
      expect(rating).toBeGreaterThanOrEqual(500)
      expect(rating).toBeLessThanOrEqual(800)
    }
  })

  it('varies ratings across different opponents', () => {
    expect(prototypeDisciplineRatings('Jack Lau')).not.toEqual(
      prototypeDisciplineRatings('Kacper Banas'),
    )
  })
})

describe('countMeetingsByOpponentName', () => {
  it('counts unique matches per opponent, case-insensitively', () => {
    const matches = [
      makeMatch({ date: '2026-01-01', opponent1: 'Jack Lau' }),
      makeMatch({ date: '2026-02-01', opponent1: 'jack lau' }),
      makeMatch({
        date: '2026-03-01',
        discipline: 'MD',
        opponent1: 'Jack Lau',
        opponent2: 'Kacper Banas',
      }),
    ]
    const counts = countMeetingsByOpponentName(matches)
    expect(counts.get('jack lau')).toBe(3)
    expect(counts.get('kacper banas')).toBe(1)
    expect(counts.get('unknown')).toBeUndefined()
  })
})

describe('formatOpponentGroupMeta', () => {
  it('joins note count with times played, and omits played when zero', () => {
    expect(formatOpponentGroupMeta(1, 0)).toBe('1 note')
    expect(formatOpponentGroupMeta(1, 1)).toBe('1 note · Played 1 time')
    expect(formatOpponentGroupMeta(3, 4)).toBe('3 notes · Played 4 times')
  })
})
