import { describe, expect, it } from 'vitest'
import type { SpreadsheetRow } from '../types/dataset'
import {
  buildCombinedCompetitionAgeValues,
  compareCompetitionAgeOldestFirst,
  competitionAgeOldestFirstRank,
  normalizeCompetitionAgeToken,
  readCompetitionAgeGroup,
  readCompetitionSubAgeGroup,
  sortCompetitionAgeGroups,
  sortCompetitionSubAgeGroups,
} from './competitionAge'

describe('competitionAge normalization', () => {
  it('normalizes age tokens with U/O prefixes and title case words', () => {
    expect(normalizeCompetitionAgeToken(' u15 ')).toBe('U15')
    expect(normalizeCompetitionAgeToken('o40')).toBe('O40')
    expect(normalizeCompetitionAgeToken('sEnIoR')).toBe('Senior')
  })

  it('reads age group aliases from spreadsheet rows', () => {
    const rowA: SpreadsheetRow = { Age: 'masters', subage: 'o45' }
    const rowB: SpreadsheetRow = { 'Age Group': 'Junior', 'Sub Age Group': 'u13' }

    expect(readCompetitionAgeGroup(rowA)).toBe('Masters')
    expect(readCompetitionSubAgeGroup(rowA)).toBe('O45')
    expect(readCompetitionAgeGroup(rowB)).toBe('Junior')
    expect(readCompetitionSubAgeGroup(rowB)).toBe('U13')
  })

  it('sorts age groups and subage values in expected domain order', () => {
    expect(
      sortCompetitionAgeGroups(['Other', 'Senior', 'Junior', 'Masters']),
    ).toEqual(['Junior', 'Senior', 'Masters', 'Other'])

    expect(
      sortCompetitionSubAgeGroups([
        'O40',
        'U17',
        'Senior',
        'Other',
        'U13',
        'Masters',
        'O35',
      ]),
    ).toEqual(['U13', 'U17', 'Senior', 'Masters', 'O35', 'O40', 'Other'])
  })

  it('ranks ages for oldest-first sorting in category milestones', () => {
    expect(competitionAgeOldestFirstRank('O40')).toBeGreaterThan(
      competitionAgeOldestFirstRank('Senior'),
    )
    expect(competitionAgeOldestFirstRank('Senior')).toBeGreaterThan(
      competitionAgeOldestFirstRank('U17'),
    )
    expect(competitionAgeOldestFirstRank('U17')).toBeGreaterThan(
      competitionAgeOldestFirstRank('U15'),
    )
    expect(compareCompetitionAgeOldestFirst('Senior', 'U15')).toBeLessThan(0)
    expect(compareCompetitionAgeOldestFirst('U15', 'Senior')).toBeGreaterThan(0)
  })

  it('builds one combined options list without duplicate top-level values', () => {
    expect(
      buildCombinedCompetitionAgeValues(
        ['Senior', 'Junior', 'Masters'],
        ['U15', 'Senior', 'O40', 'Masters'],
      ),
    ).toEqual(['Junior', 'Senior', 'Masters', 'U15', 'O40'])
  })
})
