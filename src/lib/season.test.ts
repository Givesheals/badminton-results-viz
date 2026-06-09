import { describe, expect, it } from 'vitest'
import {
  filterMatchesInSeason,
  formatSeasonId,
  getSeasonBounds,
  getSeasonForDate,
  getSeasonForReferenceDate,
  getSeasonQuarterBounds,
  getSeasonQuarterPhase,
  isDateInSeason,
  listSeasonQuarters,
  seasonQuarterKeyForDate,
  seasonQuarterNumber,
} from './season'

describe('season boundaries', () => {
  it('assigns Aug 31 to the season that started previous September', () => {
    expect(getSeasonForDate('2026-08-31')).toBe('2025-26')
    const bounds = getSeasonBounds('2025-26')!
    expect(isDateInSeason('2026-08-31', bounds)).toBe(true)
  })

  it('assigns Sept 1 to the new season', () => {
    expect(getSeasonForDate('2025-09-01')).toBe('2025-26')
    expect(getSeasonForDate('2025-08-31')).toBe('2024-25')
  })

  it('builds inclusive season bounds', () => {
    const bounds = getSeasonBounds('2025-26')!
    expect(bounds.startDate).toBe('2025-09-01')
    expect(bounds.endDate).toBe('2026-08-31')
  })

  it('filters matches to the season window', () => {
    const bounds = getSeasonBounds('2025-26')!
    const matches = [
      { date: '2025-08-30' },
      { date: '2025-09-02' },
      { date: '2026-08-31' },
      { date: '2026-09-01' },
    ]
    expect(filterMatchesInSeason(matches, bounds).map((m) => m.date)).toEqual([
      '2025-09-02',
      '2026-08-31',
    ])
  })
})

describe('season quarters', () => {
  const seasonId = '2025-26'

  it('maps months to season quarters', () => {
    expect(seasonQuarterNumber(new Date('2025-10-15T12:00:00'))).toBe(1)
    expect(seasonQuarterNumber(new Date('2026-01-10T12:00:00'))).toBe(2)
    expect(seasonQuarterNumber(new Date('2026-04-01T12:00:00'))).toBe(3)
    expect(seasonQuarterNumber(new Date('2026-07-01T12:00:00'))).toBe(4)
  })

  it('lists four quarter slots with bounds', () => {
    const quarters = listSeasonQuarters(seasonId)
    expect(quarters).toHaveLength(4)
    expect(quarters[0].startDate).toBe('2025-09-01')
    expect(quarters[0].endDate).toBe('2025-11-30')
    expect(quarters[1].startDate).toBe('2025-12-01')
    expect(quarters[3].endDate).toBe('2026-08-31')
  })

  it('keys dates to season quarter ids', () => {
    expect(seasonQuarterKeyForDate('2025-10-01', seasonId)).toBe('2025-26-Q1')
    expect(seasonQuarterKeyForDate('2026-02-14', seasonId)).toBe('2025-26-Q2')
  })

  it('classifies quarter phase from reference date', () => {
    const q1 = getSeasonQuarterBounds(seasonId, 1)!
    expect(
      getSeasonQuarterPhase(
        { startDate: q1.startDate, endDate: q1.endDate },
        new Date('2025-08-15'),
      ),
    ).toBe('future')
    expect(
      getSeasonQuarterPhase(
        { startDate: q1.startDate, endDate: q1.endDate },
        new Date('2025-10-01'),
      ),
    ).toBe('active')
    expect(
      getSeasonQuarterPhase(
        { startDate: q1.startDate, endDate: q1.endDate },
        new Date('2026-01-01'),
      ),
    ).toBe('past')
  })
})

describe('current season from reference date', () => {
  it('uses September year rollover', () => {
    expect(getSeasonForReferenceDate(new Date('2025-09-15'))).toBe(formatSeasonId(2025))
    expect(getSeasonForReferenceDate(new Date('2025-07-01'))).toBe(formatSeasonId(2024))
  })
})
