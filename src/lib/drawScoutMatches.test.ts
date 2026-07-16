import { describe, expect, it } from 'vitest'
import { drawScoutDemoMatches } from './drawScoutDemoMatches'
import {
  buildDrawScoutResultMatches,
  getDrawScoutPreviousMatches,
  getDrawScoutPreviousMatchesAgainstOpponentAlone,
  getDrawScoutPreviousMatchesAgainstPair,
  getPreviousMatchesAgainstOpponent,
  matchIncludesAllOpponents,
  matchIncludesOpponent,
} from './drawScoutMatches'
import type { NormalizedMatch } from '../types/matchHistory'
import { recapMatchKey } from './tournamentRecap'

describe('drawScoutMatches', () => {
  it('finds previous meetings with an opponent in uploaded results', () => {
    const match = drawScoutDemoMatches[0]!
    const allMatches: NormalizedMatch[] = [match]
    expect(matchIncludesOpponent(match, 'Murray Wright')).toBe(true)
    expect(getPreviousMatchesAgainstOpponent(allMatches, 'Murray Wright', 'Simon Parker')).toEqual([
      match,
    ])
  })

  it('falls back to demo meetings when none exist in uploaded results', () => {
    const result = getDrawScoutPreviousMatches([], 'Daniel Hughes', 'Simon Parker')
    expect(result.isDemo).toBe(true)
    expect(result.matches.length).toBeGreaterThanOrEqual(2)
  })

  it('prefers real meetings over demo data', () => {
    const real = { ...drawScoutDemoMatches[0]!, competitionName: 'My real event' }
    const result = getDrawScoutPreviousMatches([real], 'Murray Wright', 'Simon Parker')
    expect(result.isDemo).toBe(false)
    expect(result.matches[0]?.competitionName).toBe('My real event')
  })

  it('marks note-linked matches when building draw scout result rows', () => {
    const match = drawScoutDemoMatches[0]!
    const key = recapMatchKey(match)
    const items = buildDrawScoutResultMatches([match], [key], new Map([[key, match]]))
    expect(items).toHaveLength(1)
    expect(items[0]?.isNoteMatch).toBe(true)
  })

  it('merges note-only matches into result rows when missing from previous list', () => {
    const match = drawScoutDemoMatches[0]!
    const key = recapMatchKey(match)
    const items = buildDrawScoutResultMatches([], [key], new Map([[key, match]]))
    expect(items).toEqual([{ match, isNoteMatch: true }])
  })

  it('finds meetings against an exact draw pair', () => {
    const result = getDrawScoutPreviousMatchesAgainstPair(
      [],
      'Dan Martyres',
      'Alisha Johnson',
      'Simon Parker',
    )
    expect(result.isDemo).toBe(true)
    expect(result.matches).toHaveLength(1)
    expect(matchIncludesAllOpponents(result.matches[0]!, ['Dan Martyres', 'Alisha Johnson'])).toBe(
      true,
    )
  })

  it('excludes the drawn partner from individual previous meetings', () => {
    const alone = getDrawScoutPreviousMatchesAgainstOpponentAlone(
      [],
      'Dan Martyres',
      'Alisha Johnson',
      'Simon Parker',
    )
    expect(alone.matches.length).toBeGreaterThan(0)
    expect(
      alone.matches.every((match) => !matchIncludesOpponent(match, 'Alisha Johnson')),
    ).toBe(true)
    expect(alone.matches.every((match) => matchIncludesOpponent(match, 'Dan Martyres'))).toBe(true)
  })
})
