import { describe, expect, it } from 'vitest'
import { shouldAlignResultPair } from './RecapCelebrationHero'

describe('shouldAlignResultPair', () => {
  it('aligns two results with two events', () => {
    expect(shouldAlignResultPair(2, 2, 0)).toBe(true)
    expect(shouldAlignResultPair(2, 0, 2)).toBe(true)
  })

  it('keeps a centred pair when the events are one column or three', () => {
    expect(shouldAlignResultPair(1, 2, 0)).toBe(false)
    expect(shouldAlignResultPair(3, 2, 0)).toBe(false)
  })

  it('leaves results that are already on separate rows', () => {
    expect(shouldAlignResultPair(2, 1, 1)).toBe(false)
  })
})
