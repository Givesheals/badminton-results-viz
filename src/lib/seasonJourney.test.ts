import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import {
  computeSeasonJourney,
  formatClaimQuarterMessage,
  QUARTER_TOURNAMENT_THRESHOLD,
  resolveQuarterDisplayState,
} from './seasonJourney'

function makeMatch(overrides: Partial<NormalizedMatch>): NormalizedMatch {
  return {
    competitionName: 'Test Open',
    tournamentCategory: 'bronze',
    tournamentCategoryLabel: 'Bronze',
    date: '2025-10-15',
    discipline: 'WD',
    disciplineLabel: "Women's doubles",
    playerName: 'Alex',
    partnerName: 'Sam',
    opponents: 'Opp A & Opp B',
    outcome: 'win',
    nonCompetitiveReason: null,
    scoreSummary: '21-18, 21-17',
    playerRating: 600,
    competitionAgeGroup: 'Senior',
    competitionSubAgeGroup: 'Senior',
    raw: { 'Player Rating': 600 },
    ...overrides,
  }
}

describe('resolveQuarterDisplayState', () => {
  it('marks future quarters without progress UI', () => {
    expect(resolveQuarterDisplayState('future', 0, 4, false)).toBe('future')
  })

  it('unlocks claim when threshold met', () => {
    expect(resolveQuarterDisplayState('past', 4, 4, false)).toBe('ready_to_claim')
    expect(resolveQuarterDisplayState('past', 4, 4, true)).toBe('claimed')
  })

  it('formats an achievement-focused claim message', () => {
    expect(formatClaimQuarterMessage(4, 4, 'Q1')).toContain('Q1 goal achieved')
    expect(formatClaimQuarterMessage(4, 4, 'Q1')).toContain('4 tournaments')
    expect(formatClaimQuarterMessage(6, 4, 'Q2')).toContain('Q2 crushed')
  })

  it('closes past quarters that ended below the threshold', () => {
    expect(resolveQuarterDisplayState('past', 2, 4, false)).toBe('closed')
    expect(resolveQuarterDisplayState('active', 2, 4, false)).toBe('in_progress')
  })
})

describe('computeSeasonJourney', () => {
  const ref = new Date('2026-01-15T12:00:00')

  it('counts distinct competitions per season quarter', () => {
    const matches = [
      makeMatch({ competitionName: 'A', date: '2025-10-01' }),
      makeMatch({ competitionName: 'A', date: '2025-10-02' }),
      makeMatch({ competitionName: 'B', date: '2025-11-05' }),
      makeMatch({ competitionName: 'C', date: '2025-12-10' }),
      makeMatch({ competitionName: 'D', date: '2026-01-05' }),
    ]
    const journey = computeSeasonJourney(matches, ref)
    const q1 = journey.quarters.find((q) => q.key === '2025-26-Q1')!
    const q2 = journey.quarters.find((q) => q.key === '2025-26-Q2')!
    expect(q1.tournamentCount).toBe(2)
    expect(q2.tournamentCount).toBe(2)
    expect(q1.displayState).toBe('closed')
    expect(q2.displayState).toBe('in_progress')
  })

  it('merges claimed state for completed quarters', () => {
    const matches = Array.from({ length: QUARTER_TOURNAMENT_THRESHOLD }, (_, i) =>
      makeMatch({
        competitionName: `Event ${i + 1}`,
        date: `2025-10-${String(i + 1).padStart(2, '0')}`,
      }),
    )
    const journey = computeSeasonJourney(matches, ref, new Set(['2025-26-Q1:quarter-on-board']))
    const q1 = journey.quarters.find((q) => q.key === '2025-26-Q1')!
    expect(q1.displayState).toBe('claimed')
  })

  it('builds weekend story strip entries', () => {
    const journey = computeSeasonJourney(
      [
        makeMatch({ competitionName: 'Spring Open', date: '2025-10-01' }),
        makeMatch({ competitionName: 'Winter Cup', date: '2026-01-10' }),
      ],
      ref,
    )
    expect(journey.weekends).toHaveLength(2)
    expect(journey.weekendCount).toBe(2)
  })
})
