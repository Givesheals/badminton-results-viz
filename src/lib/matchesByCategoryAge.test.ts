import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import {
  computeMatchesByCategoryAge,
  computeMatchesByCategoryAgeForPie,
} from './matchesByCategoryAge'

function makeMatch(overrides: Partial<NormalizedMatch>): NormalizedMatch {
  return {
    competitionName: 'Test Open',
    tournamentCategory: 'bronze',
    tournamentCategoryLabel: 'Bronze',
    date: '2025-01-01',
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
    raw: {
      'Tournament Category': 'bronze',
      'Player Rating': 600,
    },
    ...overrides,
  }
}

describe('computeMatchesByCategoryAge', () => {
  it('groups competitive matches by age and tournament level, ignoring discipline', () => {
    const matches = [
      makeMatch({ discipline: 'WD', disciplineLabel: "Women's doubles" }),
      makeMatch({ discipline: 'WS', disciplineLabel: "Women's singles", partnerName: null }),
      makeMatch({
        tournamentCategory: 'gold',
        tournamentCategoryLabel: 'Gold',
        competitionAgeGroup: 'Junior',
        competitionSubAgeGroup: 'U15',
      }),
      makeMatch({
        tournamentCategory: 'gold',
        tournamentCategoryLabel: 'Gold',
        competitionAgeGroup: 'Junior',
        competitionSubAgeGroup: 'U15',
        discipline: 'MD',
        disciplineLabel: "Men's doubles",
      }),
    ]

    expect(computeMatchesByCategoryAge(matches)).toEqual([
      {
        label: 'Senior Bronze',
        tournamentCategoryLabel: 'Bronze',
        competitionAgeLabel: 'Senior',
        broadAge: 'senior',
        matches: 2,
        percent: 50,
        isGrouped: false,
      },
      {
        label: 'U15 Gold',
        tournamentCategoryLabel: 'Gold',
        competitionAgeLabel: 'U15',
        broadAge: 'junior',
        matches: 2,
        percent: 50,
        isGrouped: false,
      },
    ])
  })

  it('excludes walkovers and no-match rows', () => {
    const matches = [
      makeMatch({}),
      makeMatch({ nonCompetitiveReason: 'walkover' }),
      makeMatch({ nonCompetitiveReason: 'no_match' }),
    ]

    expect(computeMatchesByCategoryAge(matches)).toEqual([
      {
        label: 'Senior Bronze',
        tournamentCategoryLabel: 'Bronze',
        competitionAgeLabel: 'Senior',
        broadAge: 'senior',
        matches: 1,
        percent: 100,
        isGrouped: false,
      },
    ])
  })

  it('orders rows oldest age first, then Copper through Gold', () => {
    const matches = [
      makeMatch({ tournamentCategoryLabel: 'Gold', tournamentCategory: 'gold' }),
      makeMatch({
        tournamentCategoryLabel: 'Copper',
        tournamentCategory: 'copper',
        competitionAgeGroup: 'Junior',
        competitionSubAgeGroup: 'U15',
      }),
      makeMatch({
        tournamentCategoryLabel: 'Silver',
        tournamentCategory: 'silver',
        competitionAgeGroup: 'Masters',
        competitionSubAgeGroup: 'O40',
      }),
    ]

    expect(computeMatchesByCategoryAge(matches).map((row) => row.label)).toEqual([
      'O40 Silver',
      'Senior Gold',
      'U15 Copper',
    ])
  })
})

describe('computeMatchesByCategoryAgeForPie', () => {
  it('keeps detail slices when there are only a few categories', () => {
    const matches = [
      makeMatch({}),
      makeMatch({
        tournamentCategoryLabel: 'Gold',
        tournamentCategory: 'gold',
        competitionAgeGroup: 'Junior',
        competitionSubAgeGroup: 'U15',
      }),
    ]

    const slices = computeMatchesByCategoryAgeForPie(matches)
    expect(slices).toHaveLength(2)
    expect(slices.every((slice) => !slice.isGrouped)).toBe(true)
  })

  it('collapses stale age bands before current ones', () => {
    const matches = [
      makeMatch({
        date: '2025-06-01',
        tournamentCategoryLabel: 'Gold',
        tournamentCategory: 'gold',
        competitionAgeGroup: 'Masters',
        competitionSubAgeGroup: 'O50',
      }),
      makeMatch({
        date: '2020-01-01',
        tournamentCategoryLabel: 'Gold',
        tournamentCategory: 'gold',
        competitionAgeGroup: 'Masters',
        competitionSubAgeGroup: 'O40',
      }),
      makeMatch({
        date: '2019-01-01',
        tournamentCategoryLabel: 'Silver',
        tournamentCategory: 'silver',
        competitionAgeGroup: 'Masters',
        competitionSubAgeGroup: 'O40',
      }),
      makeMatch({
        date: '2018-01-01',
        tournamentCategoryLabel: 'Bronze',
        tournamentCategory: 'bronze',
        competitionAgeGroup: 'Masters',
        competitionSubAgeGroup: 'O45',
      }),
    ]

    const slices = computeMatchesByCategoryAgeForPie(matches, 3)
    expect(slices.map((slice) => slice.label)).toContain('O50 Gold')
    expect(slices.some((slice) => slice.isGrouped && slice.label.includes('O40'))).toBe(true)
    expect(slices.length).toBeLessThanOrEqual(3)
  })

  it('groups historical junior ages into a range while keeping recent play separate', () => {
    const matches = [
      makeMatch({
        date: '2025-03-01',
        tournamentCategoryLabel: 'Gold',
        tournamentCategory: 'gold',
        competitionAgeGroup: 'Junior',
        competitionSubAgeGroup: 'U17',
      }),
      ...['U11', 'U13', 'U15'].flatMap((subAge, index) => [
        makeMatch({
          date: `201${index}-01-01`,
          tournamentCategoryLabel: 'Bronze',
          tournamentCategory: 'bronze',
          competitionAgeGroup: 'Junior',
          competitionSubAgeGroup: subAge,
        }),
        makeMatch({
          date: `201${index}-06-01`,
          tournamentCategoryLabel: 'Silver',
          tournamentCategory: 'silver',
          competitionAgeGroup: 'Junior',
          competitionSubAgeGroup: subAge,
        }),
      ]),
    ]

    const slices = computeMatchesByCategoryAgeForPie(matches, 4)
    expect(slices.map((slice) => slice.label)).toContain('U17 Gold')
    expect(slices.some((slice) => slice.label === 'U11–U15')).toBe(true)
    expect(slices.length).toBeLessThanOrEqual(4)
  })
})
