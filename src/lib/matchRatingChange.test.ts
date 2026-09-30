import { describe, expect, it } from 'vitest'
import {
  allocateRatingChanges,
  buildRatingChanges,
  formatRatingChangePoints,
  type RatingChangeInput,
} from './matchRatingChange'

function input(
  key: string,
  outcome: 'win' | 'loss',
  winProbability: number | null = 0.5,
): RatingChangeInput {
  return { key, outcome, winProbability }
}

function sum(map: Map<string, number>): number {
  return [...map.values()].reduce((a, b) => a + b, 0)
}

describe('allocateRatingChanges', () => {
  it('always sums exactly to the discipline total', () => {
    const cases: Array<[RatingChangeInput[], number]> = [
      [[input('a', 'win'), input('b', 'win'), input('c', 'loss')], 16],
      [[input('a', 'win', 0.22), input('b', 'win'), input('c', 'loss', 0.7)], 11],
      [[input('a', 'win'), input('b', 'loss'), input('c', 'loss')], -9],
      [[input('a', 'loss')], -4],
      [[input('a', 'win')], 0],
      [[input('a', 'win'), input('b', 'win'), input('c', 'win')], 14],
      [[input('a', 'loss'), input('b', 'loss')], -12],
      [[input('a', 'win', null), input('b', 'loss', null)], 0],
    ]

    for (const [inputs, total] of cases) {
      expect(sum(allocateRatingChanges(inputs, total))).toBe(total)
    }
  })

  it('makes wins positive and losses negative when several matches share a real total', () => {
    const result = allocateRatingChanges(
      [input('w1', 'win'), input('w2', 'win'), input('l1', 'loss')],
      16,
    )
    expect(result.get('w1')!).toBeGreaterThan(0)
    expect(result.get('w2')!).toBeGreaterThan(0)
    expect(result.get('l1')!).toBeLessThan(0)
  })

  it('gives bigger gains for less likely wins', () => {
    const result = allocateRatingChanges(
      [input('upset', 'win', 0.2), input('expected', 'win', 0.8), input('l', 'loss')],
      12,
    )
    expect(result.get('upset')!).toBeGreaterThan(result.get('expected')!)
  })

  it('returns nothing when there are no matches', () => {
    expect(allocateRatingChanges([], 5).size).toBe(0)
  })
})

describe('buildRatingChanges', () => {
  it('describes gains, losses and no change in plain language', () => {
    const changes = buildRatingChanges(
      [input('w', 'win', 0.3), input('l', 'loss', 0.6)],
      2,
    )
    expect(changes.get('w')!.explanation).toContain('You gained')
    expect(changes.get('w')!.explanation).toContain('30%')
    expect(changes.get('l')!.explanation).toContain('You lost')

    const flat = buildRatingChanges([input('only', 'win')], 0)
    expect(flat.get('only')!.explanation).toContain('did not change')
  })

  it('never uses em dashes in copy', () => {
    const changes = buildRatingChanges([input('w', 'win'), input('l', 'loss')], 3)
    for (const change of changes.values()) {
      expect(change.explanation).not.toContain('\u2014')
    }
  })
})

describe('formatRatingChangePoints', () => {
  it('signs positives and zero', () => {
    expect(formatRatingChangePoints(8)).toBe('+8')
    expect(formatRatingChangePoints(-3)).toBe('-3')
    expect(formatRatingChangePoints(0)).toBe('±0')
  })
})
