import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import { computePartnerChemistry } from './partnerChemistry'

function makeMatch(
  overrides: Partial<NormalizedMatch> &
    Pick<NormalizedMatch, 'partnerName' | 'outcome'>,
): NormalizedMatch {
  const {
    partnerName,
    outcome,
    raw: rawOverrides,
    playerRating = 500,
    ...rest
  } = overrides

  return {
    competitionName: 'Test Open',
    tournamentCategory: 'bronze',
    tournamentCategoryLabel: 'Bronze',
    date: '2025-06-01',
    discipline: 'WD',
    disciplineLabel: "Women's doubles",
    playerName: 'Alex',
    opponents: 'Opponents',
    nonCompetitiveReason: null,
    scoreSummary: '21-15',
    playerRating,
    ...rest,
    partnerName,
    outcome,
    raw: {
      'Tournament Category': 'bronze',
      Round: 'Group A',
      'Player Game 1 Score': 21,
      'Opponent Game 1 Score': 15,
      'Partner Rating': 482,
      'Opponent 1 Rating': 500,
      'Opponent 2 Rating': 500,
      ...rawOverrides,
    },
  }
}

function makeRatedSet(
  partnerName: string,
  wins: number,
  losses: number,
  partnerRating: number,
): NormalizedMatch[] {
  const matches: NormalizedMatch[] = []
  for (let i = 0; i < wins; i += 1) {
    matches.push(
      makeMatch({
        partnerName,
        outcome: 'win',
        raw: { 'Partner Rating': partnerRating },
      }),
    )
  }
  for (let i = 0; i < losses; i += 1) {
    matches.push(
      makeMatch({
        partnerName,
        outcome: 'loss',
        raw: { 'Partner Rating': partnerRating },
      }),
    )
  }
  return matches
}

function makeUnratedSet(partnerName: string, wins: number, losses: number): NormalizedMatch[] {
  const matches: NormalizedMatch[] = []
  for (let i = 0; i < wins; i += 1) {
    matches.push(
      makeMatch({
        partnerName,
        outcome: 'win',
        raw: {
          'Partner Rating': null,
          'Opponent 1 Rating': null,
          'Opponent 2 Rating': null,
        },
      }),
    )
  }
  for (let i = 0; i < losses; i += 1) {
    matches.push(
      makeMatch({
        partnerName,
        outcome: 'loss',
        raw: {
          'Partner Rating': null,
          'Opponent 1 Rating': null,
          'Opponent 2 Rating': null,
        },
      }),
    )
  }
  return matches
}

describe('computePartnerChemistry', () => {
  const matches = [
    ...makeRatedSet('HighChem', 3, 2, 446),
    ...makeRatedSet('HighWin', 4, 1, 549),
    ...makeUnratedSet('Unrated', 3, 2),
  ]

  it('sorts by overperformance in chemistry mode', () => {
    const result = computePartnerChemistry(matches, 5, 'matches', 'chemistry')

    expect(result.partners.map((row) => row.partnerName)).toEqual(['HighChem', 'HighWin', 'Unrated'])
    expect(result.partners[0]!.overperformance).toBeGreaterThan(
      result.partners[1]!.overperformance ?? 0,
    )
    expect(result.partners[2]!.overperformance).toBeNull()
  })

  it('sorts by adjusted partnership rating in partnership-rating mode', () => {
    const result = computePartnerChemistry(matches, 5, 'matches', 'partnershipRating')

    expect(result.partners.map((row) => row.partnerName)).toEqual([
      'HighWin',
      'HighChem',
      'Unrated',
    ])
    expect(result.partners[0]!.adjustedPartnershipRating).toBeGreaterThan(
      result.partners[1]!.adjustedPartnershipRating ?? 0,
    )
    expect(result.partners[0]!.avgTeamRating).toBe(525)
    expect(result.partners[1]!.avgTeamRating).toBe(473)
    expect(result.partners[2]!.adjustedPartnershipRating).toBeNull()
  })

  it('derives adjusted partnership rating from team rating and chemistry', () => {
    const result = computePartnerChemistry(matches, 5, 'matches', 'partnershipRating')
    const highChem = result.partners.find((row) => row.partnerName === 'HighChem')!

    expect(highChem.avgPlayerRating).toBe(500)
    expect(highChem.avgPartnerRating).toBe(446)
    expect(highChem.avgTeamRating).toBe(473)
    expect(highChem.chemistryRatingPoints).not.toBeNull()
    expect(highChem.adjustedPartnershipRating).toBe(
      highChem.avgTeamRating! + highChem.chemistryRatingPoints!,
    )
  })
})
