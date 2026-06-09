import type { DatasetStats } from '../types/dataset'
import type { NormalizedMatch } from '../types/matchHistory'
import { competitiveMatches } from './matchExclusions'
import { getPrimaryPlayerName } from './matchHistory'
import { sumMatchVolumes } from './matchScores'

function roundPercent(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null
  return Math.round((numerator / denominator) * 1000) / 10
}

export function computeStatsFromMatches(matches: NormalizedMatch[]): DatasetStats {
  const competitive = competitiveMatches(matches)
  const matchWins = competitive.filter((m) => m.outcome === 'win').length
  const matchLosses = competitive.filter((m) => m.outcome === 'loss').length
  const decidedMatches = matchWins + matchLosses
  const playerName = getPrimaryPlayerName(matches)
  const { gamesPlayed, playerPoints, opponentPoints } = sumMatchVolumes(competitive)
  const totalPoints = playerPoints + opponentPoints

  const dates = competitive
    .map((m) => new Date(m.date))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())

  return {
    playerName,
    dateFrom: dates[0]?.toISOString().slice(0, 10) ?? null,
    dateTo: dates.at(-1)?.toISOString().slice(0, 10) ?? null,
    matchesPlayed: competitive.length,
    gamesPlayed,
    matchWins,
    matchLosses,
    matchWinPercent: roundPercent(matchWins, decidedMatches),
    playerPoints,
    opponentPoints,
    pointsWinPercent: roundPercent(playerPoints, totalPoints),
  }
}
