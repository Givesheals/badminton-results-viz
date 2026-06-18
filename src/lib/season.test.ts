import { describe, expect, it } from 'vitest'
import {
  filterMatchesInSeason,
  formatSeasonId,
  getSeasonBounds,
  getSeasonForDate,
  getSeasonForReferenceDate,
  getInSeasonQuarterSegments,
  getSeasonQuarterPhase,
  isDateInSeason,
  listSeasonQuarters,
  seasonQuarterKeyForDate,
  seasonQuarterNumber,
} from './season'

describe('season boundaries', () => {
  it('assigns Sep 30 to the season that started previous October', () => {
    expect(getSeasonForDate('2026-09-30')).toBe('2025-26')
    const bounds = getSeasonBounds('2025-26')!
    expect(isDateInSeason('2026-09-30', bounds)).toBe(true)
  })

  it('assigns Oct 1 to the new season', () => {
    expect(getSeasonForDate('2025-10-01')).toBe('2025-26')
    expect(getSeasonForDate('2025-09-30')).toBe('2024-25')
  })

  it('builds inclusive season bounds', () => {
    const bounds = getSeasonBounds('2025-26')!
    expect(bounds.startDate).toBe('2025-10-01')
    expect(bounds.endDate).toBe('2026-09-30')
  })

  it('filters matches to the season window', () => {
    const bounds = getSeasonBounds('2025-26')!
    const matches = [
      { date: '2025-09-30' },
      { date: '2025-10-02' },
      { date: '2026-09-30' },
      { date: '2026-10-01' },
    ]
    expect(filterMatchesInSeason(matches, bounds).map((m) => m.date)).toEqual([
      '2025-10-02',
      '2026-09-30',
    ])
  })
})

describe('season quarters', () => {
  const seasonId = '2025-26'

  it('maps months to season quarters', () => {
    expect(seasonQuarterNumber(new Date('2025-09-15T12:00:00'))).toBe(1)
    expect(seasonQuarterNumber(new Date('2025-10-15T12:00:00'))).toBe(1)
    expect(seasonQuarterNumber(new Date('2026-01-10T12:00:00'))).toBe(2)
    expect(seasonQuarterNumber(new Date('2026-04-01T12:00:00'))).toBe(3)
    expect(seasonQuarterNumber(new Date('2026-07-01T12:00:00'))).toBe(4)
    expect(seasonQuarterNumber(new Date('2026-09-15T12:00:00'))).toBe(1)
  })

  it('lists four quarter slots with bounds', () => {
    const quarters = listSeasonQuarters(seasonId)
    expect(quarters).toHaveLength(4)
    expect(quarters[0].label).toContain('Sep–Nov')
    expect(quarters[1].label).toContain('Dec–Feb')
    expect(quarters[2].label).toContain('Mar–May')
    expect(quarters[3].label).toContain('Jun–Aug')
    expect(quarters[0].startDate).toBe('2025-09-01')
    expect(quarters[0].endDate).toBe('2025-11-30')
    expect(quarters[1].startDate).toBe('2025-12-01')
    expect(quarters[3].endDate).toBe('2026-08-31')
  })

  it('keys dates to season quarter ids', () => {
    expect(seasonQuarterKeyForDate('2025-10-01', seasonId)).toBe('2025-26-Q1')
    expect(seasonQuarterKeyForDate('2026-02-14', seasonId)).toBe('2025-26-Q2')
    expect(seasonQuarterKeyForDate('2026-09-15', seasonId)).toBe('2025-26-Q1')
  })

  it('classifies quarter phase from reference date', () => {
    const q1 = listSeasonQuarters(seasonId)[0]!
    expect(getSeasonQuarterPhase(q1, new Date('2025-09-15'))).toBe('future')
    expect(getSeasonQuarterPhase(q1, new Date('2025-10-01'))).toBe('active')
    expect(getSeasonQuarterPhase(q1, new Date('2026-01-01'))).toBe('past')
    expect(getSeasonQuarterPhase(q1, new Date('2026-09-15'))).toBe('active')
    expect(getSeasonQuarterPhase(q1, new Date('2026-10-01'))).toBe('past')
  })

  it('clips Q1 to in-season windows at the start and end of the season', () => {
    const segments = getInSeasonQuarterSegments(seasonId, 1)
    expect(segments).toEqual([
      { startDate: '2025-10-01', endDate: '2025-11-30' },
      { startDate: '2026-09-01', endDate: '2026-09-30' },
    ])
  })
})

describe('current season from reference date', () => {
  it('uses October year rollover', () => {
    expect(getSeasonForReferenceDate(new Date('2025-10-15'))).toBe(formatSeasonId(2025))
    expect(getSeasonForReferenceDate(new Date('2025-09-15'))).toBe(formatSeasonId(2024))
    expect(getSeasonForReferenceDate(new Date('2025-07-01'))).toBe(formatSeasonId(2024))
  })
})
