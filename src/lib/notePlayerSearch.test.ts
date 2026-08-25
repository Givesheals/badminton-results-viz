import { describe, expect, it } from 'vitest'
import { searchNotePlayers } from './notePlayerSearch'

describe('searchNotePlayers', () => {
  it('lists history opponents when the query is empty', () => {
    const { fromHistory, fromRegister } = searchNotePlayers('', ['Kim', 'Lee'])
    expect(fromRegister).toEqual([])
    expect(fromHistory.map((player) => player.name)).toEqual(['Kim', 'Lee'])
    expect(fromHistory[0]?.beNumber).toMatch(/^\d{7}$/)
  })

  it('finds register players by surname with county and BE number', () => {
    const { fromRegister } = searchNotePlayers('simon', [])
    const names = fromRegister.map((player) => player.name)
    expect(names).toContain('Alexandra Simon')
    expect(names).toContain('Joel Simon')
    expect(fromRegister.every((player) => player.county.length > 0)).toBe(true)
    expect(fromRegister.every((player) => player.beNumber.length >= 7)).toBe(true)
  })

  it('keeps history matches above register matches for the same query', () => {
    const { fromHistory, fromRegister } = searchNotePlayers('simon', ['Joel Simon'])
    expect(fromHistory.some((player) => player.name === 'Joel Simon')).toBe(true)
    expect(fromRegister.some((player) => player.name === 'Joel Simon')).toBe(false)
    expect(fromRegister.some((player) => player.name === 'Alexandra Simon')).toBe(true)
  })
})
