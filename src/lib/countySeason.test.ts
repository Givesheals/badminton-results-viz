import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import {
  classifyCountyProgram,
  computeCountySeason,
  COUNTY_SEASON_DISCLAIMER,
} from './countySeason'

function makeMatch(overrides: Partial<NormalizedMatch> = {}): NormalizedMatch {
  return {
    competitionName: 'County Championships 2025-2026',
    tournamentCategory: 'county',
    tournamentCategoryLabel: 'County',
    date: '2026-03-22',
    discipline: 'WD',
    disciplineLabel: "Women's doubles",
    playerName: 'Alex',
    partnerName: 'Sam Partner',
    opponents: 'Opp A & Opp B',
    outcome: 'win',
    nonCompetitiveReason: null,
    scoreSummary: '21-18, 21-17',
    playerRating: 580,
    competitionAgeGroup: 'Senior',
    competitionSubAgeGroup: 'Senior',
    raw: {
      'Tournament Category': 'N/A',
      'Player Rating': 580,
      'Partner Rating': 583,
      'Opponent 1 Rating': 620,
      'Opponent 2 Rating': 615,
    },
    ...overrides,
  }
}

describe('classifyCountyProgram', () => {
  it('classifies shires league fixtures', () => {
    expect(
      classifyCountyProgram(
        makeMatch({
          competitionName: 'Spring League',
          date: '2026-04-05',
        }),
      ),
    ).toBe('shires')
  })

  it('classifies senior county championships', () => {
    expect(classifyCountyProgram(makeMatch())).toBe('senior-county')
  })

  it('ignores club championships tagged as county', () => {
    expect(
      classifyCountyProgram(
        makeMatch({
          competitionName: 'Club Championship',
        }),
      ),
    ).toBeNull()
  })
})

describe('computeCountySeason', () => {
  it('returns null when there is no county activity', () => {
    expect(
      computeCountySeason([
        makeMatch({
          tournamentCategoryLabel: 'Bronze',
          tournamentCategory: 'bronze',
          raw: { 'Tournament Category': 'Bronze' },
        }),
      ]),
    ).toBeNull()
  })

  it('builds separate shires and senior county programs', () => {
    const data = computeCountySeason(
      [
        makeMatch({
          competitionName: 'County Championships 2025-2026',
          outcome: 'loss',
        }),
        makeMatch({
          competitionName: 'County Championships 2025-2026',
          discipline: 'XD',
          disciplineLabel: 'Mixed doubles',
          outcome: 'win',
          partnerName: 'Chris Cross',
        }),
        makeMatch({
          competitionName: 'Spring League',
          date: '2026-04-05',
          outcome: 'win',
        }),
      ],
      'test-season',
    )

    expect(data).not.toBeNull()
    expect(data!.programs).toHaveLength(2)
    expect(data!.programs.map((program) => program.program)).toEqual(['shires', 'senior-county'])
    expect(data!.disclaimer).toBe(COUNTY_SEASON_DISCLAIMER)
  })

  it('summarises wins, partners, and a primary team deterministically', () => {
    const data = computeCountySeason(
      [
        makeMatch({ competitionName: 'Spring League', date: '2026-04-05', outcome: 'win' }),
        makeMatch({
          competitionName: 'Spring League',
          date: '2026-04-05',
          discipline: 'XD',
          partnerName: 'Chris Cross',
          outcome: 'win',
        }),
        makeMatch({
          competitionName: 'Spring League',
          date: '2026-05-10',
          partnerName: 'Sam Partner',
          outcome: 'loss',
        }),
      ],
      'stable-seed',
    )!

    const shires = data.programs.find((program) => program.program === 'shires')!
    expect(shires.wins).toBe(2)
    expect(shires.losses).toBe(1)
    expect(shires.partners.map((partner) => partner.name)).toEqual(['Sam Partner', 'Chris Cross'])
    expect(shires.primaryTeam).toMatch(/^(Cambs|Oxon|Surrey|Herts|Essex|Kent|Berks|Norfolk) [1-3]$/)

    const repeat = computeCountySeason(
      [
        makeMatch({ competitionName: 'Spring League', date: '2026-04-05', outcome: 'win' }),
        makeMatch({
          competitionName: 'Spring League',
          date: '2026-04-05',
          discipline: 'XD',
          partnerName: 'Chris Cross',
          outcome: 'win',
        }),
        makeMatch({
          competitionName: 'Spring League',
          date: '2026-05-10',
          partnerName: 'Sam Partner',
          outcome: 'loss',
        }),
      ],
      'stable-seed',
    )!

    expect(repeat.programs[0]!.primaryTeam).toBe(shires.primaryTeam)
  })
})
