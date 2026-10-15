import { describe, expect, it } from 'vitest'
import {
  formatIsoWeekNumber,
  formatIsoWeekRangeLabel,
  isoWeekOf,
  weeksInIsoYear,
} from './isoWeek'

describe('isoWeekOf', () => {
  it('uses the ISO week for a mid-year date', () => {
    expect(isoWeekOf(new Date(2026, 9, 9))).toEqual({ isoYear: 2026, week: 41 })
    expect(isoWeekOf(new Date(2026, 3, 13))).toEqual({ isoYear: 2026, week: 16 })
  })

  it('assigns late December to the next ISO year when that week belongs there', () => {
    expect(isoWeekOf(new Date(2025, 11, 29))).toEqual({ isoYear: 2026, week: 1 })
    expect(isoWeekOf(new Date(2025, 11, 28))).toEqual({ isoYear: 2025, week: 52 })
  })
})

describe('weeksInIsoYear', () => {
  it('counts 53 weeks only for long ISO years', () => {
    expect(weeksInIsoYear(2026)).toBe(53)
    expect(weeksInIsoYear(2020)).toBe(53)
    expect(weeksInIsoYear(2025)).toBe(52)
    expect(weeksInIsoYear(2021)).toBe(52)
  })
})

describe('formatIsoWeekRangeLabel', () => {
  it('names the Monday-to-Sunday range', () => {
    expect(formatIsoWeekRangeLabel(2026, 16)).toBe(
      'Week 16 runs from Monday, April 13, 2026 to Sunday, April 19, 2026',
    )
    expect(formatIsoWeekRangeLabel(2026, 41)).toBe(
      'Week 41 runs from Monday, October 5, 2026 to Sunday, October 11, 2026',
    )
  })

  it('keeps both calendar years when a week crosses New Year', () => {
    expect(formatIsoWeekRangeLabel(2026, 1)).toBe(
      'Week 1 runs from Monday, December 29, 2025 to Sunday, January 4, 2026',
    )
  })
})

describe('formatIsoWeekNumber', () => {
  it('pads a single digit', () => {
    expect(formatIsoWeekNumber(1)).toBe('01')
    expect(formatIsoWeekNumber(36)).toBe('36')
  })
})
