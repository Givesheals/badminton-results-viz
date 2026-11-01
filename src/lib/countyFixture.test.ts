import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import { planCountyFixtures } from './countyFixture'

function match(
  overrides: Partial<NormalizedMatch> & Pick<NormalizedMatch, 'discipline' | 'opponents'>,
): NormalizedMatch {
  return {
    competitionName: 'Masters County Championships 2025-26',
    tournamentCategory: 'county',
    tournamentCategoryLabel: 'County',
    date: '2026-02-22',
    disciplineLabel: overrides.discipline,
    playerName: 'Alex',
    partnerName: null,
    outcome: 'loss',
    nonCompetitiveReason: null,
    scoreSummary: '21-18, 21-17',
    playerRating: 580,
    competitionAgeGroup: 'Masters',
    raw: { 'Tournament Category': 'N/A' },
    ...overrides,
  }
}

describe('planCountyFixtures', () => {
  it('keeps one tie when a player has a pair of doubles and one mixed', () => {
    const matches = [
      match({ discipline: 'OD', opponents: 'A' }),
      match({ discipline: 'OD', opponents: 'B' }),
      match({ discipline: 'XD', opponents: 'C' }),
    ]

    const plan = planCountyFixtures(matches, 'Cambs')

    expect(plan.program).toBe('masters-county')
    expect(plan.headerFixture?.home.startsWith('Cambs')).toBe(true)
    const away = plan.headerFixture?.away
    expect(away).toBeTruthy()
    expect(plan.byMatch.get(matches[0]!)?.fixture.away).toBe(away)
    expect(plan.byMatch.get(matches[1]!)?.fixture.away).toBe(away)
    expect(plan.byMatch.get(matches[2]!)?.fixture.away).toBe(away)
  })

  it('splits a day into ties when every discipline divides into rubbers', () => {
    const matches = [
      match({ discipline: 'OD', opponents: 'OD1' }),
      match({ discipline: 'OD', opponents: 'OD2' }),
      match({ discipline: 'XD', opponents: 'XD1' }),
      match({ discipline: 'OD', opponents: 'OD3' }),
      match({ discipline: 'OD', opponents: 'OD4' }),
      match({ discipline: 'XD', opponents: 'XD2' }),
    ]

    const plan = planCountyFixtures(matches, 'Cambs')
    const away = (opponent: string) =>
      plan.byMatch.get(matches.find((row) => row.opponents === opponent)!)!.fixture.away

    expect(plan.headerFixture).toBeNull()
    expect(away('OD1')).toBe(away('OD2'))
    expect(away('OD1')).toBe(away('XD1'))
    expect(away('OD3')).toBe(away('OD4'))
    expect(away('OD3')).toBe(away('XD2'))
    expect(away('OD1')).not.toBe(away('OD3'))
  })

  it('splits three ties when doubles has two games in each', () => {
    const matches = [
      ...[0, 1, 2].map((tie) => match({ discipline: 'OS', opponents: `OS${tie}` })),
      ...[0, 1, 2].flatMap((tie) => [
        match({ discipline: 'OD', opponents: `OD${tie}a` }),
        match({ discipline: 'OD', opponents: `OD${tie}b` }),
      ]),
      ...[0, 1, 2].map((tie) => match({ discipline: 'XD', opponents: `XD${tie}` })),
    ]

    const plan = planCountyFixtures(matches, 'Cambs')
    const away = (opponent: string) =>
      plan.byMatch.get(matches.find((row) => row.opponents === opponent)!)!.fixture.away

    expect(new Set([away('OS0'), away('OS1'), away('OS2')]).size).toBe(3)
    expect(away('OS0')).toBe(away('OD0a'))
    expect(away('OS0')).toBe(away('OD0b'))
    expect(away('OS0')).toBe(away('XD0'))
    expect(away('OS1')).toBe(away('OD1a'))
    expect(away('OS2')).toBe(away('XD2'))
  })

  it('leaves a county challenge as one tie', () => {
    const matches = [0, 1, 2, 3, 4, 5].map((index) =>
      match({
        competitionName: 'Masters County Challenge 2024',
        discipline: 'OD',
        opponents: `OD${index}`,
      }),
    )

    const plan = planCountyFixtures(matches, 'Cambs')
    const aways = new Set(
      matches.map((row) => plan.byMatch.get(row)!.fixture.away),
    )

    expect(plan.headerFixture).not.toBeNull()
    expect(aways.size).toBe(1)
  })

  it('does not invent a tie for a graded tournament', () => {
    const matches = [
      match({
        competitionName: 'Cambridgeshire Senior Bronze',
        tournamentCategory: 'bronze',
        tournamentCategoryLabel: 'Bronze',
        discipline: 'OD',
        opponents: 'A',
        raw: { 'Tournament Category': 'Bronze' },
      }),
    ]

    const plan = planCountyFixtures(matches, 'Cambs')
    expect(plan.program).toBeNull()
    expect(plan.headerFixture).toBeNull()
    expect(plan.byMatch.size).toBe(0)
  })
})
