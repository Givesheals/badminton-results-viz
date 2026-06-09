import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import {
  buildFilterOptions,
  filterMatches,
  hasActiveFilters,
  SINGLES_PARTNER_VALUE,
} from './filterMatches'

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

describe('filterMatches with competition age', () => {
  const matches = [
    makeMatch({ competitionAgeGroup: 'Senior', competitionSubAgeGroup: 'Senior' }),
    makeMatch({
      competitionName: 'Youth Open',
      competitionAgeGroup: 'Junior',
      competitionSubAgeGroup: 'U15',
      date: '2025-02-02',
    }),
    makeMatch({
      competitionName: 'Masters Open',
      competitionAgeGroup: 'Masters',
      competitionSubAgeGroup: 'O40',
      date: '2024-03-03',
      partnerName: null,
    }),
  ]

  it('filters by age group and subage independently', () => {
    const baseFilters = {
      competition: '',
      discipline: '',
      partner: '',
      time: 'all',
      competitionAge: '',
    }

    expect(
      filterMatches(matches, { ...baseFilters, competitionAge: 'Junior' }).length,
    ).toBe(1)
    expect(
      filterMatches(matches, { ...baseFilters, competitionAge: 'O40' }).length,
    ).toBe(1)
  })

  it('includes competition-age options in sorted order', () => {
    const options = buildFilterOptions(matches)
    expect(options.competitionAges.map((o) => o.value)).toEqual([
      'Junior',
      'Senior',
      'Masters',
      'U15',
      'O40',
    ])
  })

  it('treats age filters and singles partner as active filters', () => {
    expect(
      hasActiveFilters({
        competition: '',
        discipline: '',
        partner: '',
        time: 'all',
        competitionAge: 'Junior',
      }),
    ).toBe(true)

    const singlesOnly = filterMatches(matches, {
      competition: '',
      discipline: '',
      partner: SINGLES_PARTNER_VALUE,
      time: 'all',
      competitionAge: 'O40',
    })
    expect(singlesOnly).toHaveLength(1)
  })
})
