import { describe, expect, it } from 'vitest'
import { searchBePlayers } from './bePlayerDirectory'

describe('searchBePlayers', () => {
  it('returns multiple matches for duplicate names', () => {
    const results = searchBePlayers('Simon Parker')
    expect(results.length).toBeGreaterThanOrEqual(3)
    expect(results.every((player) => player.name === 'Simon Parker')).toBe(true)
  })

  it('finds players by club or BE number', () => {
    expect(searchBePlayers('Cambridge BC').some((p) => p.beNumber === '1206628')).toBe(true)
    expect(searchBePlayers('1206628')).toHaveLength(1)
  })

  it('returns empty for short queries', () => {
    expect(searchBePlayers('S')).toEqual([])
  })
})
