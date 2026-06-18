import { describe, expect, it } from 'vitest'
import {
  formatSeasonRatingDelta,
  formatSeasonRatingDeltaInParens,
  ratingAxisDomainAndTicks,
  seasonRatingDeltaTone,
  seasonRatingDeltas,
  type SeasonRatingSeries,
} from './seasonRatings'

function seriesRow(
  family: 'singles' | 'doubles' | 'mixed',
  points: { rating: number }[],
): SeasonRatingSeries {
  const labels = { singles: 'Singles', doubles: 'Doubles', mixed: 'Mixed' }
  const colors = {
    singles: 'var(--color-discipline-singles)',
    doubles: 'var(--color-discipline-doubles)',
    mixed: 'var(--color-discipline-mixed)',
  }
  return {
    family,
    label: labels[family],
    color: colors[family],
    points: points.map((p, i) => ({
      date: `2025-10-${String(i + 1).padStart(2, '0')}`,
      timestamp: Date.parse(`2025-10-${String(i + 1).padStart(2, '0')}T12:00:00`),
      rating: p.rating,
      matchCount: 1,
      competitions: ['Test Open'],
    })),
  }
}

describe('seasonRatingDeltas', () => {
  it('returns signed deltas for each discipline with enough points', () => {
    const deltas = seasonRatingDeltas([
      seriesRow('singles', [{ rating: 500 }, { rating: 512 }]),
      seriesRow('doubles', [{ rating: 600 }, { rating: 604 }]),
      seriesRow('mixed', [{ rating: 550 }]),
    ])

    expect(deltas.find((d) => d.family === 'singles')?.delta).toBe(12)
    expect(deltas.find((d) => d.family === 'doubles')?.delta).toBe(4)
    expect(deltas.find((d) => d.family === 'mixed')?.delta).toBeNull()
  })
})

describe('formatSeasonRatingDelta', () => {
  it('prefixes positive values with a plus sign', () => {
    expect(formatSeasonRatingDelta(4)).toBe('+4')
    expect(formatSeasonRatingDelta(-2)).toBe('-2')
    expect(formatSeasonRatingDelta(0)).toBe('0')
  })
})

describe('formatSeasonRatingDeltaInParens', () => {
  it('formats deltas for the legend summary', () => {
    expect(formatSeasonRatingDeltaInParens(36)).toBe('(+36)')
    expect(formatSeasonRatingDeltaInParens(-42)).toBe('(-42)')
    expect(formatSeasonRatingDeltaInParens(0)).toBe('(±0)')
    expect(formatSeasonRatingDeltaInParens(null)).toBe('(—)')
  })
})

describe('seasonRatingDeltaTone', () => {
  it('maps deltas to gain, loss, or neutral tones', () => {
    expect(seasonRatingDeltaTone(12)).toBe('gain')
    expect(seasonRatingDeltaTone(-8)).toBe('loss')
    expect(seasonRatingDeltaTone(0)).toBe('neutral')
    expect(seasonRatingDeltaTone(null)).toBe('neutral')
  })
})

describe('ratingAxisDomainAndTicks', () => {
  it('rounds domain and ticks to multiples of 25', () => {
    const { domain, ticks } = ratingAxisDomainAndTicks([537, 612, 589])
    expect(domain[0] % 25).toBe(0)
    expect(domain[1] % 25).toBe(0)
    expect(ticks.every((tick) => tick % 25 === 0)).toBe(true)
    expect(ticks[0]).toBeLessThanOrEqual(domain[0])
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(domain[1])
  })

  it('returns a sensible default when there are no ratings', () => {
    const { domain, ticks } = ratingAxisDomainAndTicks([])
    expect(domain).toEqual([0, 1000])
    expect(ticks).toEqual([0, 250, 500, 750, 1000])
  })
})
