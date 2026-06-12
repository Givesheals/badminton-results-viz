import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import { getSeasonBounds } from './season'
import {
  computeSeasonAccolades,
  computeSeasonPersonalBests,
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
    competitionSubAgeGroup: null,
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

  it('maps semi-final loss to third when the player won earlier', () => {
    const matches = [
      makeMatch({
        competitionName: 'Cup',
        date: '2025-11-01',
        discipline: 'WS',
        outcome: 'win',
        raw: { Round: 'Quarter-final' },
      }),
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

  it('does not map semi-final loss to third without a competitive win', () => {
    const matches = [
      makeMatch({
        competitionName: 'Cup',
        date: '2025-11-01',
        discipline: 'WS',
        outcome: 'loss',
        raw: { Round: 'Semi-final' },
      }),
    ]
    expect(placementFromBestStage(matches, 'semi-final')).toBeNull()
  })

  it('maps bronze final win to third after an earlier competitive win', () => {
    const matches = [
      makeMatch({
        competitionName: 'Cup',
        date: '2025-11-01',
        discipline: 'WS',
        outcome: 'win',
        raw: { Round: 'Quarter-final' },
      }),
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

  it('excludes third place when the only win was a walkover', () => {
    const matches = [
      makeMatch({
        competitionName: 'Cup',
        date: '2025-11-01',
        discipline: 'WS',
        outcome: 'win',
        nonCompetitiveReason: 'walkover',
        scoreSummary: 'Walkover win',
        raw: { Round: 'Group A' },
      }),
      makeMatch({
        competitionName: 'Cup',
        date: '2025-11-01',
        discipline: 'WS',
        outcome: 'win',
        raw: { Round: 'Bronze Final' },
      }),
    ]
    expect(placementFromBestStage(matches, 'semi-final')).toBeNull()
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
        outcome: 'win',
        tournamentCategoryLabel: 'Bronze',
        raw: {
          Round: 'Quarter-final',
          'Tournament Category': 'Bronze',
          'Player Game 1 Score': 21,
          'Opponent Game 1 Score': 15,
          'Player Game 2 Score': 21,
          'Opponent Game 2 Score': 12,
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
    const win = [
      makeMatch({
        competitionName: 'Bronze Win',
        date: '2025-11-01',
        discipline: 'WS',
        outcome: 'win',
        raw: { Round: 'Quarter-final' },
      }),
      makeMatch({
        competitionName: 'Bronze Win',
        date: '2025-11-01',
        discipline: 'WS',
        outcome: 'win',
        raw: { Round: 'Bronze Final' },
      }),
    ]
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

    const cabinet = computeSeasonTrophyCabinet([...win, loss], seasonBounds)
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
    expect(cabinet.first[0]!.contextNote).toBe('Your 2nd Senior Gold title')
  })

  it('scopes first and repeat titles to competition age group', () => {
    const seniorWin = makeMatch({
      competitionName: 'Senior Silver',
      date: '2025-06-01',
      discipline: 'XD',
      partnerName: 'Sam',
      tournamentCategoryLabel: 'Silver',
      competitionAgeGroup: 'Senior',
      raw: { Round: 'Final', 'Tournament Category': 'Silver' },
    })
    const mastersFirstWin = makeMatch({
      competitionName: 'West of England Masters Silver',
      date: '2025-11-15',
      discipline: 'XD',
      partnerName: 'Sam',
      tournamentCategoryLabel: 'Silver',
      competitionAgeGroup: 'Masters',
      raw: { Round: 'Final', 'Tournament Category': 'Silver' },
    })
    const mastersSecondWin = makeMatch({
      competitionName: 'Hampshire Masters',
      date: '2026-02-14',
      discipline: 'XD',
      partnerName: 'Sam',
      tournamentCategoryLabel: 'Silver',
      competitionAgeGroup: 'Masters',
      raw: { Round: 'Final', 'Tournament Category': 'Silver' },
    })

    const cabinet = computeSeasonTrophyCabinet(
      [seniorWin, mastersFirstWin, mastersSecondWin],
      seasonBounds,
    )

    expect(cabinet.first).toHaveLength(2)
    expect(cabinet.first[0]!.competitionAgeLabel).toBe('Masters')
    expect(cabinet.first[0]!.contextNote).toBe('Your first Masters Silver title')
    expect(cabinet.first[1]!.contextNote).toBe('Your 2nd Masters Silver title')
  })

  it('scopes runner-up firsts to competition age group', () => {
    const seniorRunnerUp = makeMatch({
      competitionName: 'Senior Silver',
      date: '2025-06-01',
      discipline: 'OD',
      partnerName: 'Sam',
      outcome: 'loss',
      tournamentCategoryLabel: 'Silver',
      competitionAgeGroup: 'Senior',
      raw: {
        Round: 'Final',
        'Tournament Category': 'Silver',
        'Player Game 1 Score': 18,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 17,
        'Opponent Game 2 Score': 21,
      },
    })
    const mastersRunnerUp = makeMatch({
      competitionName: 'West of England Masters Silver',
      date: '2025-11-15',
      discipline: 'OD',
      partnerName: 'Sam',
      outcome: 'loss',
      tournamentCategoryLabel: 'Silver',
      competitionAgeGroup: 'Masters',
      raw: {
        Round: 'Final',
        'Tournament Category': 'Silver',
        'Player Game 1 Score': 18,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 17,
        'Opponent Game 2 Score': 21,
      },
    })

    const cabinet = computeSeasonTrophyCabinet(
      [seniorRunnerUp, mastersRunnerUp],
      seasonBounds,
    )

    expect(cabinet.second).toHaveLength(1)
    expect(cabinet.second[0]!.contextNote).toBe('Your first Masters Silver runner-up finish')
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

describe('computeSeasonPersonalBests', () => {
  const qfWeekend = (comp: string, date: string) => [
    makeMatch({
      competitionName: comp,
      date,
      discipline: 'WS',
      tournamentCategoryLabel: 'Gold',
      outcome: 'win',
      raw: {
        Round: 'Group 1',
        'Tournament Category': 'Gold',
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 15,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 12,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    }),
    makeMatch({
      competitionName: comp,
      date,
      discipline: 'WS',
      tournamentCategoryLabel: 'Gold',
      outcome: 'loss',
      raw: {
        Round: 'QF',
        'Tournament Category': 'Gold',
        'Player Game 1 Score': 19,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 18,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    }),
  ]

  it('detects a personal best when season depth beats prior career', () => {
    const priorGroup = makeMatch({
      competitionName: 'Earlier Gold',
      date: '2025-06-01',
      discipline: 'WS',
      tournamentCategoryLabel: 'Gold',
      outcome: 'loss',
      raw: {
        Round: 'Group 1',
        'Tournament Category': 'Gold',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const personalBests = computeSeasonPersonalBests(
      [priorGroup, ...qfWeekend('Autumn Open', '2025-11-01')],
      seasonBounds,
    )

    expect(personalBests).toHaveLength(1)
    expect(personalBests[0]!.competitionName).toBe('Autumn Open')
    expect(personalBests[0]!.detail).toContain('Quarter-final')
  })

  it('excludes podium finishes from personal bests', () => {
    const win = makeMatch({
      competitionName: 'Win Open',
      date: '2025-11-01',
      discipline: 'WS',
      tournamentCategoryLabel: 'Gold',
      raw: { Round: 'Final', 'Tournament Category': 'Gold' },
    })

    const personalBests = computeSeasonPersonalBests([win], seasonBounds)
    expect(personalBests).toHaveLength(0)
  })

  it('does not celebrate when depth only matches prior career best', () => {
    const personalBests = computeSeasonPersonalBests(
      [
        ...qfWeekend('Earlier Gold', '2025-06-01'),
        ...qfWeekend('Again Gold', '2025-12-01'),
      ],
      seasonBounds,
    )

    expect(personalBests).toHaveLength(0)
  })
})

describe('computeSeasonAccolades', () => {
  it('combines podium and personal best data', () => {
    const priorGroup = makeMatch({
      competitionName: 'Earlier Gold',
      date: '2025-06-01',
      discipline: 'WS',
      tournamentCategoryLabel: 'Gold',
      outcome: 'loss',
      raw: {
        Round: 'Group 1',
        'Tournament Category': 'Gold',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const qfWeekend = [
      makeMatch({
        competitionName: 'Autumn Open',
        date: '2025-11-01',
        discipline: 'WS',
        tournamentCategoryLabel: 'Gold',
        outcome: 'win',
        raw: {
          Round: 'Group 1',
          'Tournament Category': 'Gold',
          'Player Game 1 Score': 21,
          'Opponent Game 1 Score': 15,
          'Player Game 2 Score': 21,
          'Opponent Game 2 Score': 12,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      }),
      makeMatch({
        competitionName: 'Autumn Open',
        date: '2025-11-01',
        discipline: 'WS',
        tournamentCategoryLabel: 'Gold',
        outcome: 'loss',
        raw: {
          Round: 'QF',
          'Tournament Category': 'Gold',
          'Player Game 1 Score': 19,
          'Opponent Game 1 Score': 21,
          'Player Game 2 Score': 18,
          'Opponent Game 2 Score': 21,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      }),
    ]
    const win = makeMatch({
      competitionName: 'Winter Cup',
      date: '2026-01-10',
      discipline: 'WD',
      partnerName: 'Sam',
      tournamentCategoryLabel: 'Silver',
      raw: { Round: 'Final', 'Tournament Category': 'Silver' },
    })

    const accolades = computeSeasonAccolades([priorGroup, ...qfWeekend, win], seasonBounds)

    expect(accolades.totalPodiumCount).toBe(1)
    expect(accolades.podium.first[0]!.competitionName).toBe('Winter Cup')
    expect(accolades.personalBests).toHaveLength(1)
    expect(accolades.personalBests[0]!.competitionName).toBe('Autumn Open')
  })
})
