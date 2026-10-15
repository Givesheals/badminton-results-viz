import { describe, expect, it } from 'vitest'
import { shouldStackResultPair } from './RecapCelebrationHero'

describe('shouldStackResultPair', () => {
  it('stacks two results when there are two callouts and two events', () => {
    expect(shouldStackResultPair(2, 2, 2, 0)).toBe(true)
    expect(shouldStackResultPair(2, 2, 0, 2)).toBe(true)
  })

  it('keeps a side-by-side pair when the events are one column or three', () => {
    expect(shouldStackResultPair(1, 2, 2, 0)).toBe(false)
    expect(shouldStackResultPair(3, 2, 2, 0)).toBe(false)
  })

  it('leaves results that are already on separate rows', () => {
    expect(shouldStackResultPair(2, 2, 1, 1)).toBe(false)
  })

  it('does not stack when the callout count is not two', () => {
    expect(shouldStackResultPair(2, 1, 2, 0)).toBe(false)
    expect(shouldStackResultPair(2, 0, 2, 0)).toBe(false)
  })
})
