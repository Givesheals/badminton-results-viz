import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import { getSeasonBounds } from './season'
import {
  computeSeasonTrophyCabinet,
  placementFromBestStage,
} from './seasonTrophyCabinet'

function makeMatch(
  overrides: Partial<NormalizedMatch> &
    Pick<NormalizedMatch, 'competitionName' | 'date' | 'discipline'>,
): NormalizedMatch {
  const { competitionName, date, discipline, ...rest } = overrides
  return {
    tournamentCategory: overrides.tournamentCategory ?? 'bronze',
    tournamentCategoryLabel: overrides.tournamentCategoryLabel ?? 'Bronze',
    disciplineLabel: overrides.disciplineLabel ?? discipline,
    playerName: 'Alex',
    partnerName: null,
    opponents: 'Opponent',
    outcome: 'win',
    nonCompetitiveReason: null,
    scoreSummary: '21-15, 21-12',
    playerRating: 570,
    competitionAgeGroup: 'Senior',
    competitionSubAgeGroup: 'Senior',
    raw: {
      'Tournament Category': overrides.tournamentCategoryLabel ?? 'Bronze',
      'Player Game 1 Score': 21,
      'Opponent Game 1 Score': 15,
      'Player Game 2 Score': 21,
      'Opponent Game 2 Score': 12,
      'Player Game 3 Score': null,
      'Opponent Game 3 Score': null,
    },
    ...rest,
    competitionName,
    date,
    discipline,
  }
}

const seasonBounds = getSeasonBounds('2025-26')!

describe('placementFromBestStage', () => {
  it('maps winner and runner-up', () => {
    expect(placementFromBestStage([], 'winner')).toBe('first')
    expect(placementFromBestStage([], 'runner-up')).toBe('second')
  })

  it('maps semi-final loss to third', () => {
    const matches = [
      makeMatch({
        competitionName: 'Cup',
        date: '2025-11-01',
        discipline: 'WS',
        outcome: 'loss',
        raw: { Round: 'Semi-final' },
      }),
    ]
    expect(placementFromBestStage(matches, 'semi-final')).toBe('third')
  })

  it('maps bronze final win to third', () => {
    const matches = [
      makeMatch({
        competitionName: 'Cup',
        date: '2025-11-01',
        discipline: 'WS',
        outcome: 'win',
        raw: { Round: 'Bronze Final' },
      }),
    ]
    expect(placementFromBestStage(matches, 'semi-final')).toBe('third')
  })

  it('excludes bronze final loss', () => {
    const matches = [
      makeMatch({
        competitionName: 'Cup',
        date: '2025-11-01',
        discipline: 'WS',
        outcome: 'loss',
        raw: { Round: 'Bronze Final' },
      }),
    ]
    expect(placementFromBestStage(matches, 'semi-final')).toBeNull()
  })
})

describe('computeSeasonTrophyCabinet', () => {
  it('places winner, runner-up, and semi-final loss on correct shelves', () => {
    const matches = [
      makeMatch({
        competitionName: 'Win Open',
        date: '2025-11-01',
        discipline: 'WS',
        tournamentCategoryLabel: 'Gold',
        raw: { Round: 'Final', 'Tournament Category': 'Gold' },
      }),
      makeMatch({
        competitionName: 'Runner Open',
        date: '2025-12-01',
        discipline: 'WD',
        partnerName: 'Sam',
        outcome: 'loss',
        tournamentCategoryLabel: 'Silver',
        raw: {
          Round: 'Final',
          'Tournament Category': 'Silver',
          'Player Game 1 Score': 18,
          'Opponent Game 1 Score': 21,
          'Player Game 2 Score': 17,
          'Opponent Game 2 Score': 21,
        },
      }),
      makeMatch({
        competitionName: 'Semi Open',
        date: '2026-01-01',
        discipline: 'MD',
        partnerName: 'Sam',
        outcome: 'loss',
        tournamentCategoryLabel: 'Bronze',
        raw: {
          Round: 'Semi-final',
          'Tournament Category': 'Bronze',
          'Player Game 1 Score': 19,
          'Opponent Game 1 Score': 21,
          'Player Game 2 Score': 18,
          'Opponent Game 2 Score': 21,
        },
      }),
    ]

    const cabinet = computeSeasonTrophyCabinet(matches, seasonBounds)
    expect(cabinet.first).toHaveLength(1)
    expect(cabinet.first[0]!.competitionName).toBe('Win Open')
    expect(cabinet.second).toHaveLength(1)
    expect(cabinet.second[0]!.competitionName).toBe('Runner Open')
    expect(cabinet.third).toHaveLength(1)
    expect(cabinet.third[0]!.competitionName).toBe('Semi Open')
    expect(cabinet.totalCount).toBe(3)
  })

  it('includes bronze final win on third shelf and excludes bronze final loss', () => {
    const win = makeMatch({
      competitionName: 'Bronze Win',
      date: '2025-11-01',
      discipline: 'WS',
      outcome: 'win',
      raw: { Round: 'Bronze Final' },
    })
    const loss = makeMatch({
      competitionName: 'Bronze Loss',
      date: '2025-12-01',
      discipline: 'WD',
      partnerName: 'Sam',
      outcome: 'loss',
      raw: {
        Round: 'Bronze Final',
        'Player Game 1 Score': 18,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 17,
        'Opponent Game 2 Score': 21,
      },
    })

    const cabinet = computeSeasonTrophyCabinet([win, loss], seasonBounds)
    expect(cabinet.third).toHaveLength(1)
    expect(cabinet.third[0]!.competitionName).toBe('Bronze Win')
    expect(cabinet.totalCount).toBe(1)
  })

  it('excludes events outside the season', () => {
    const priorSeason = makeMatch({
      competitionName: 'Old Win',
      date: '2025-06-01',
      discipline: 'WS',
      raw: { Round: 'Final' },
    })
    const thisSeason = makeMatch({
      competitionName: 'New Win',
      date: '2025-11-01',
      discipline: 'WD',
      partnerName: 'Sam',
      raw: { Round: 'Final' },
    })

    const cabinet = computeSeasonTrophyCabinet([priorSeason, thisSeason], seasonBounds)
    expect(cabinet.first).toHaveLength(1)
    expect(cabinet.first[0]!.competitionName).toBe('New Win')
  })

  it('adds career context for first and repeat titles', () => {
    const firstWin = makeMatch({
      competitionName: 'First Gold',
      date: '2025-06-01',
      discipline: 'WS',
      tournamentCategoryLabel: 'Gold',
      raw: { Round: 'Final', 'Tournament Category': 'Gold' },
    })
    const secondWin = makeMatch({
      competitionName: 'Second Gold',
      date: '2025-11-01',
      discipline: 'WS',
      tournamentCategoryLabel: 'Gold',
      raw: { Round: 'Final', 'Tournament Category': 'Gold' },
    })

    const cabinet = computeSeasonTrophyCabinet([firstWin, secondWin], seasonBounds)
    expect(cabinet.first).toHaveLength(1)
    expect(cabinet.first[0]!.contextNote).toBe('Your 2nd Gold title')
  })

  it('creates separate trophies for multiple disciplines at one weekend', () => {
    const matches = [
      makeMatch({
        competitionName: 'Weekend Cup',
        date: '2025-11-01',
        discipline: 'WD',
        partnerName: 'Sam',
        raw: { Round: 'Final' },
      }),
      makeMatch({
        competitionName: 'Weekend Cup',
        date: '2025-11-02',
        discipline: 'XD',
        partnerName: 'Sam',
        raw: { Round: 'Final' },
      }),
    ]

    const cabinet = computeSeasonTrophyCabinet(matches, seasonBounds)
    expect(cabinet.first).toHaveLength(2)
    expect(cabinet.first.map((t) => t.discipline).sort()).toEqual(['WD', 'XD'])
  })

  it('returns empty cabinet when no podium finishes exist', () => {
    const matches = [
      makeMatch({
        competitionName: 'Early Exit',
        date: '2025-11-01',
        discipline: 'WS',
        outcome: 'loss',
        raw: { Round: 'Quarter-final' },
      }),
    ]

    const cabinet = computeSeasonTrophyCabinet(matches, seasonBounds)
    expect(cabinet.totalCount).toBe(0)
    expect(cabinet.first).toHaveLength(0)
    expect(cabinet.second).toHaveLength(0)
    expect(cabinet.third).toHaveLength(0)
  })
})
