import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import {
  classifyCountyFixture,
  countyFixtureForWeekend,
  inferRepresentedCounty,
} from './countyFixture'

function makeMatch(
  overrides: Partial<NormalizedMatch> &
    Pick<NormalizedMatch, 'competitionName' | 'date' | 'discipline'>,
): NormalizedMatch {
  const { competitionName, date, discipline, ...rest } = overrides
  return {
    tournamentCategory: 'county',
    tournamentCategoryLabel: 'County',
    disciplineLabel: discipline,
    playerName: 'Alex',
    partnerName: null,
    opponents: 'Opponent',
    outcome: 'win',
    nonCompetitiveReason: null,
    scoreSummary: '21-15, 21-12',
    playerRating: 500,
    raw: { 'Tournament Category': 'N/A' },
    ...rest,
    competitionName,
    date,
    discipline,
  }
}

describe('classifyCountyFixture', () => {
  it('treats shires league as shires', () => {
    expect(
      classifyCountyFixture(
        makeMatch({ competitionName: 'Shires League 2024-25', date: '2025-03-02', discipline: 'OS' }),
      ),
    ).toBe('shires')
  })

  it('treats senior county championships as senior county', () => {
    expect(
      classifyCountyFixture(
        makeMatch({
          competitionName: 'Senior County Championships - Regional Divisions 2024-25',
          date: '2025-03-22',
          discipline: 'MD',
          competitionAgeGroup: 'Senior',
        }),
      ),
    ).toBe('senior-county')
  })

  it('treats masters county championships as masters county', () => {
    expect(
      classifyCountyFixture(
        makeMatch({
          competitionName: 'Masters County Championships 2025-26',
          date: '2026-02-12',
          discipline: 'OD',
          competitionAgeGroup: 'Masters',
        }),
      ),
    ).toBe('masters-county')
  })

  it('ignores graded tournaments', () => {
    expect(
      classifyCountyFixture(
        makeMatch({
          competitionName: 'Cambridgeshire Senior Bronze',
          date: '2026-07-12',
          discipline: 'OS',
          tournamentCategory: 'bronze',
          tournamentCategoryLabel: 'Bronze',
          raw: { 'Tournament Category': 'Bronze' },
        }),
      ),
    ).toBeNull()
  })
})

describe('countyFixtureForWeekend', () => {
  it('uses green-style county names without a squad number for shires', () => {
    const fixture = countyFixtureForWeekend(
      [
        makeMatch({
          competitionName: 'Shires League 2024-25',
          date: '2025-03-02',
          discipline: 'OS',
        }),
      ],
      'Cambs',
    )
    expect(fixture).toEqual({
      program: 'shires',
      home: 'Cambs',
      away: expect.any(String),
    })
    expect(fixture!.away).not.toMatch(/\d/)
    expect(fixture!.away).not.toBe('Cambs')
  })

  it('adds squad numbers for senior and masters county', () => {
    const senior = countyFixtureForWeekend(
      [
        makeMatch({
          competitionName: 'Senior County Championships',
          date: '2025-03-22',
          discipline: 'MD',
          competitionAgeGroup: 'Senior',
        }),
      ],
      'Cambs',
    )
    const masters = countyFixtureForWeekend(
      [
        makeMatch({
          competitionName: 'Masters County Championships 2025-26',
          date: '2026-02-12',
          discipline: 'OD',
          competitionAgeGroup: 'Masters',
        }),
      ],
      'Cambs',
    )
    expect(senior!.program).toBe('senior-county')
    expect(masters!.program).toBe('masters-county')
    expect(senior!.home).toMatch(/^Cambs [1-3]$/)
    expect(masters!.home).toMatch(/^Cambs [1-3]$/)
    expect(senior!.away).toMatch(/ [1-3]$/)
    expect(masters!.away).toMatch(/ [1-3]$/)
  })

  it('keeps the same tie for every rubber in the weekend', () => {
    const matches = ['OS', 'OD', 'XD'].map((discipline) =>
      makeMatch({
        competitionName: 'Shires League 2024-25',
        date: '2025-03-02',
        discipline,
      }),
    )
    const first = countyFixtureForWeekend(matches, 'Cambs')
    const second = countyFixtureForWeekend(matches, 'Cambs')
    expect(second).toEqual(first)
  })

  it('returns nothing for a graded weekend', () => {
    expect(
      countyFixtureForWeekend(
        [
          makeMatch({
            competitionName: 'Suffolk Open',
            date: '2026-04-01',
            discipline: 'OS',
            raw: { 'Tournament Category': 'Silver' },
          }),
        ],
        'Cambs',
      ),
    ).toBeNull()
  })
})

describe('inferRepresentedCounty', () => {
  it('prefers the county on home events over a busier away circuit', () => {
    const matches = [
      makeMatch({
        competitionName: 'Kent Masters Gold 2026',
        date: '2026-01-10',
        discipline: 'OS',
        raw: { 'Tournament Category': 'Gold' },
      }),
      makeMatch({
        competitionName: 'Kent Masters Gold 2026',
        date: '2026-01-10',
        discipline: 'OD',
        raw: { 'Tournament Category': 'Gold' },
      }),
      makeMatch({
        competitionName: 'Cambridgeshire Restricted 2025',
        date: '2025-09-01',
        discipline: 'OS',
        raw: { 'Tournament Category': 'Other' },
      }),
    ]
    expect(inferRepresentedCounty(matches)).toBe('Cambs')
  })
})
