import type { NormalizedMatch } from '../types/matchHistory'
import { isCompetitiveMatch } from './matchExclusions'
import { getMatchExpectedWinProbability } from './ratings'

export type PartnerChemistryFilterMode = 'games' | 'competitions'

export type PartnerChemistryRow = {
  partnerName: string
  games: number
  competitions: number
  wins: number
  losses: number
  ratedGames: number
  actualWinPercent: number
  expectedWinPercent: number | null
  overperformance: number | null
}

export type PartnerChemistryResult = {
  partners: PartnerChemistryRow[]
  hiddenCount: number
  totalPartnerCount: number
  doublesMatchCount: number
}

type PartnerAccumulator = {
  partnerName: string
  wins: number
  losses: number
  expectedSum: number
  ratedGames: number
  competitions: Set<string>
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10
}

function meetsThreshold(
  row: PartnerChemistryRow,
  minThreshold: number,
  filterMode: PartnerChemistryFilterMode,
): boolean {
  const count = filterMode === 'games' ? row.games : row.competitions
  return count >= minThreshold
}

export function computePartnerChemistry(
  matches: NormalizedMatch[],
  minThreshold: number,
  filterMode: PartnerChemistryFilterMode,
): PartnerChemistryResult {
  const doublesMatches = matches.filter(
    (m) =>
      isCompetitiveMatch(m) &&
      m.partnerName != null &&
      (m.outcome === 'win' || m.outcome === 'loss'),
  )

  const byPartner = new Map<string, PartnerAccumulator>()

  for (const match of doublesMatches) {
    const partnerName = match.partnerName!
    let acc = byPartner.get(partnerName)
    if (!acc) {
      acc = {
        partnerName,
        wins: 0,
        losses: 0,
        expectedSum: 0,
        ratedGames: 0,
        competitions: new Set(),
      }
      byPartner.set(partnerName, acc)
    }

    if (match.outcome === 'win') acc.wins += 1
    else acc.losses += 1

    acc.competitions.add(match.competitionName)

    const expected = getMatchExpectedWinProbability(match)
    if (expected != null) {
      acc.expectedSum += expected
      acc.ratedGames += 1
    }
  }

  const allRows: PartnerChemistryRow[] = [...byPartner.values()].map((acc) => {
    const games = acc.wins + acc.losses
    const actualWinPercent = roundPercent((acc.wins / games) * 100)
    const expectedWinPercent =
      acc.ratedGames > 0
        ? roundPercent((acc.expectedSum / acc.ratedGames) * 100)
        : null
    const overperformance =
      expectedWinPercent != null
        ? roundPercent(actualWinPercent - expectedWinPercent)
        : null

    return {
      partnerName: acc.partnerName,
      games,
      competitions: acc.competitions.size,
      wins: acc.wins,
      losses: acc.losses,
      ratedGames: acc.ratedGames,
      actualWinPercent,
      expectedWinPercent,
      overperformance,
    }
  })

  const visible = allRows
    .filter((row) => meetsThreshold(row, minThreshold, filterMode))
    .sort((a, b) => {
      const aOver = a.overperformance ?? -Infinity
      const bOver = b.overperformance ?? -Infinity
      if (bOver !== aOver) return bOver - aOver
      return b.games - a.games
    })

  return {
    partners: visible,
    hiddenCount: allRows.length - visible.length,
    totalPartnerCount: allRows.length,
    doublesMatchCount: doublesMatches.length,
  }
}
