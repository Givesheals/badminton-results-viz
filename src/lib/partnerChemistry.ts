import type { NormalizedMatch } from '../types/matchHistory'
import { isCompetitiveMatch } from './matchExclusions'
import {
  getMatchExpectedWinProbability,
  getOurTeamRating,
  getPartnerRating,
  getPlayerRating,
  overperformancePercentToRatingPoints,
} from './ratings'

export type PartnerChemistryFilterMode = 'matches' | 'competitions'

export type PartnerChemistryDisplayMode = 'chemistry' | 'partnershipRating'

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
  avgPlayerRating: number | null
  avgPartnerRating: number | null
  avgTeamRating: number | null
  chemistryRatingPoints: number | null
  adjustedPartnershipRating: number | null
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
  playerRatingSum: number
  partnerRatingSum: number
  partnerRatedGames: number
  teamRatingSum: number
  competitions: Set<string>
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10
}

function roundRating(value: number): number {
  return Math.round(value)
}

function meetsThreshold(
  row: PartnerChemistryRow,
  minThreshold: number,
  filterMode: PartnerChemistryFilterMode,
): boolean {
  const count = filterMode === 'matches' ? row.games : row.competitions
  return count >= minThreshold
}

function sortPartners(
  rows: PartnerChemistryRow[],
  displayMode: PartnerChemistryDisplayMode,
): PartnerChemistryRow[] {
  return [...rows].sort((a, b) => {
    if (displayMode === 'partnershipRating') {
      const aRating = a.adjustedPartnershipRating ?? -Infinity
      const bRating = b.adjustedPartnershipRating ?? -Infinity
      if (bRating !== aRating) return bRating - aRating
      return b.games - a.games
    }

    const aOver = a.overperformance ?? -Infinity
    const bOver = b.overperformance ?? -Infinity
    if (bOver !== aOver) return bOver - aOver
    return b.games - a.games
  })
}

export function computePartnerChemistry(
  matches: NormalizedMatch[],
  minThreshold: number,
  filterMode: PartnerChemistryFilterMode,
  displayMode: PartnerChemistryDisplayMode = 'chemistry',
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
        playerRatingSum: 0,
        partnerRatingSum: 0,
        partnerRatedGames: 0,
        teamRatingSum: 0,
        competitions: new Set(),
      }
      byPartner.set(partnerName, acc)
    }

    if (match.outcome === 'win') acc.wins += 1
    else acc.losses += 1

    acc.competitions.add(match.competitionName)

    const expected = getMatchExpectedWinProbability(match)
    if (expected != null) {
      const playerRating = getPlayerRating(match)
      const partnerRating = getPartnerRating(match)
      const teamRating = getOurTeamRating(match)

      acc.expectedSum += expected
      acc.ratedGames += 1

      if (playerRating != null) {
        acc.playerRatingSum += playerRating
      }
      if (partnerRating != null) {
        acc.partnerRatingSum += partnerRating
        acc.partnerRatedGames += 1
      }
      if (teamRating != null) {
        acc.teamRatingSum += teamRating
      }
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
    const avgPlayerRating =
      acc.ratedGames > 0 ? roundRating(acc.playerRatingSum / acc.ratedGames) : null
    const avgPartnerRating =
      acc.partnerRatedGames > 0
        ? roundRating(acc.partnerRatingSum / acc.partnerRatedGames)
        : null
    const avgTeamRating =
      acc.ratedGames > 0 ? roundRating(acc.teamRatingSum / acc.ratedGames) : null
    const chemistryRatingPoints =
      overperformance != null ? overperformancePercentToRatingPoints(overperformance) : null
    const adjustedPartnershipRating =
      avgTeamRating != null && chemistryRatingPoints != null
        ? roundRating(avgTeamRating + chemistryRatingPoints)
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
      avgPlayerRating,
      avgPartnerRating,
      avgTeamRating,
      chemistryRatingPoints,
      adjustedPartnershipRating,
    }
  })

  const visible = sortPartners(
    allRows.filter((row) => meetsThreshold(row, minThreshold, filterMode)),
    displayMode,
  )

  return {
    partners: visible,
    hiddenCount: allRows.length - visible.length,
    totalPartnerCount: allRows.length,
    doublesMatchCount: doublesMatches.length,
  }
}
