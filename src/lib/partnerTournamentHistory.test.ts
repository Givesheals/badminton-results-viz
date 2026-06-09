import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import {
  buildPartnerTournamentHistory,
  countPartnerTournamentEvents,
} from './partnerTournamentHistory'

function makeMatch(
  overrides: Partial<NormalizedMatch> &
    Pick<NormalizedMatch, 'competitionName' | 'date' | 'discipline' | 'partnerName'>,
): NormalizedMatch {
  const { competitionName, date, discipline, partnerName, raw: rawOverrides, ...rest } =
    overrides
  return {
    tournamentCategory: 'bronze',
    tournamentCategoryLabel: 'Bronze',
    disciplineLabel: discipline,
    playerName: 'Alex',
    opponents: 'Opponent',
    outcome: 'win',
    nonCompetitiveReason: null,
    scoreSummary: '21-15',
    playerRating: 570,
    ...rest,
    competitionName,
    date,
    discipline,
    partnerName,
    raw: {
      'Tournament Category': 'bronze',
      Round: 'Semi Final',
      'Player Game 1 Score': 21,
      'Opponent Game 1 Score': 15,
      ...rawOverrides,
    },
  }
}

describe('buildPartnerTournamentHistory', () => {
  it('groups events by best stage reached, deepest stages first', () => {
    const matches = [
      makeMatch({
        competitionName: 'Group Event',
        date: '2025-06-01',
        discipline: 'WD',
        partnerName: 'Lucy',
        raw: { Round: 'Group A' },
      }),
      makeMatch({
        competitionName: 'Final Event',
        date: '2026-01-01',
        discipline: 'WD',
        partnerName: 'Lucy',
        outcome: 'win',
        raw: { Round: 'Final' },
      }),
      makeMatch({
        competitionName: 'Final Event',
        date: '2026-01-02',
        discipline: 'WD',
        partnerName: 'Lucy',
        outcome: 'loss',
        raw: { Round: 'Semi Final' },
      }),
    ]

    const groups = buildPartnerTournamentHistory(matches, 'Lucy', 'doubles')
    expect(groups.map((g) => g.stage)).toEqual(['winner', 'group-wins'])
    expect(groups[0]!.tournaments[0]!.competitionName).toBe('Final Event')
    expect(countPartnerTournamentEvents(groups)).toBe(2)
  })

  it('sorts tournaments within a stage by most recent date first', () => {
    const matches = [
      makeMatch({
        competitionName: 'Older SF',
        date: '2025-01-01',
        discipline: 'WD',
        partnerName: 'Sam',
        raw: { Round: 'Semi Final' },
      }),
      makeMatch({
        competitionName: 'Newer SF',
        date: '2026-03-01',
        discipline: 'WD',
        partnerName: 'Sam',
        raw: { Round: 'Semi Final' },
      }),
    ]

    const groups = buildPartnerTournamentHistory(matches, 'Sam', 'doubles')
    expect(groups).toHaveLength(1)
    expect(groups[0]!.tournaments.map((t) => t.competitionName)).toEqual([
      'Newer SF',
      'Older SF',
    ])
  })

  it('ignores other partners and mixed when building doubles history', () => {
    const matches = [
      makeMatch({
        competitionName: 'Doubles',
        date: '2026-01-01',
        discipline: 'WD',
        partnerName: 'Lucy',
        raw: { Round: 'Quarter Final' },
      }),
      makeMatch({
        competitionName: 'Mixed',
        date: '2026-01-01',
        discipline: 'XD',
        partnerName: 'Lucy',
        raw: { Round: 'Quarter Final' },
      }),
      makeMatch({
        competitionName: 'Other',
        date: '2026-01-01',
        discipline: 'WD',
        partnerName: 'Other',
        raw: { Round: 'Quarter Final' },
      }),
    ]

    const groups = buildPartnerTournamentHistory(matches, 'Lucy', 'doubles')
    expect(countPartnerTournamentEvents(groups)).toBe(1)
    expect(groups[0]!.tournaments[0]!.competitionName).toBe('Doubles')
  })
})
